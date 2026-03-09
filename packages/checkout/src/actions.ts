"use server";

import Stripe from "stripe";
import { getCart } from "@amazone/cart";
import { createOrder } from "@amazone/orders";
import {
  db,
  products,
  orders,
  orderItems,
  stripeWebhookEvents,
  coupons,
  orderCoupons,
} from "@amazone/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  checkoutSessionSchema,
  type CheckoutSessionInput,
  type CheckoutResult,
  type WebhookResult,
  type ApplyCouponResult,
} from "./types";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  return new Stripe(key);
}

/**
 * Validate a coupon code against the current order subtotal.
 * Does NOT increment usageCount — that happens in the webhook on confirmed payment.
 */
export async function applyCoupon(
  code: string,
  orderTotalCents: number
): Promise<ApplyCouponResult> {
  const normalized = code.trim().toUpperCase();

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);

  if (!coupon) {
    return { valid: false, error: "Coupon code not found." };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active." };
  }

  if (coupon.expiresAt !== null && coupon.expiresAt < new Date()) {
    return { valid: false, error: "This coupon has expired." };
  }

  if (
    coupon.maxUsages !== null &&
    coupon.usageCount >= coupon.maxUsages
  ) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }

  if (
    coupon.minOrderCents !== null &&
    orderTotalCents < coupon.minOrderCents
  ) {
    const minDollars = (coupon.minOrderCents / 100).toFixed(2);
    return {
      valid: false,
      error: `This coupon requires a minimum order of $${minDollars}.`,
    };
  }

  // Calculate the discount amount in cents
  let discountCents: number;
  if (coupon.discountType === "percentage") {
    discountCents = Math.floor((orderTotalCents * coupon.discountValue) / 100);
  } else {
    // fixed — cap at the order total so we never produce a negative charge
    discountCents = Math.min(coupon.discountValue, orderTotalCents);
  }

  return {
    valid: true,
    discountCents,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}

export async function createCheckoutSession(
  userId: string,
  input: CheckoutSessionInput
): Promise<CheckoutResult> {
  const validated = checkoutSessionSchema.parse(input);
  const stripe = getStripe();

  // Fail fast if Stripe is not configured — don't create an order without payment
  if (!stripe) {
    throw new Error("Payment processing is currently unavailable. Please try again later.");
  }

  const cart = await getCart(userId);

  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Verify stock availability for all items
  const productIds = cart.items.map((item) => item.product.id);
  const currentProducts = await db
    .select({ id: products.id, stock: products.stock, price: products.price })
    .from(products)
    .where(inArray(products.id, productIds));

  const stockMap = new Map(currentProducts.map((p) => [p.id, p]));

  for (const item of cart.items) {
    const product = stockMap.get(item.product.id);
    if (!product || product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for product: ${item.product.name}`
      );
    }
  }

  // Calculate subtotal in cents (server-verified prices, not client prices)
  const subtotalCents = cart.items.reduce((sum, item) => {
    const p = stockMap.get(item.product.id);
    return sum + (p?.price ?? 0) * item.quantity;
  }, 0);

  // Resolve coupon server-side if a code was provided
  let resolvedCouponId: string | null = null;
  let discountCents = 0;

  if (validated.couponCode) {
    const couponResult = await applyCoupon(validated.couponCode, subtotalCents);
    if (!couponResult.valid) {
      throw new Error(`Coupon error: ${couponResult.error}`);
    }
    discountCents = couponResult.discountCents;

    // Fetch the coupon ID for the order_coupons record
    const [couponRow] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, couponResult.code))
      .limit(1);

    if (couponRow) {
      resolvedCouponId = couponRow.id;
    }
  }

  // Create order with verified prices (atomic DB transaction in @amazone/orders)
  const order = await createOrder(
    userId,
    {
      shippingName: validated.shippingName,
      shippingAddress: validated.shippingAddress,
      shippingCity: validated.shippingCity,
      shippingState: validated.shippingState,
      shippingCountry: validated.shippingCountry,
      shippingZip: validated.shippingZip,
    },
    cart.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      priceInCents: stockMap.get(item.product.id)!.price,
    }))
  );

  // Record the coupon application alongside the order (same transaction would be ideal,
  // but createOrder is owned by @amazone/orders which doesn't know about coupons).
  // We insert order_coupons immediately after — the Stripe session hasn't been paid yet,
  // so if the user abandons, we simply never increment usageCount in the webhook.
  if (resolvedCouponId !== null && discountCents > 0) {
    await db.insert(orderCoupons).values({
      orderId: order.id,
      couponId: resolvedCouponId,
      discountCents,
    });
  }

  // Build line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    cart.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images: item.product.images?.slice(0, 1) ?? [],
        },
        unit_amount: stockMap.get(item.product.id)!.price,
      },
      quantity: item.quantity,
    }));

  // Apply discount as a negative line item so the Stripe receipt reflects it.
  // We avoid the Stripe coupon/promotion-code API to keep control server-side
  // and avoid coupling our coupon lifecycle to Stripe's coupon objects.
  if (discountCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Discount (${validated.couponCode ?? ""})`,
        },
        unit_amount: -discountCents,
      },
      quantity: 1,
    });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: undefined, // Will be set from auth session if available
    line_items: lineItems,
    metadata: {
      orderId: order.id,
      userId,
      ...(validated.couponCode ? { couponCode: validated.couponCode } : {}),
    },
    success_url: `${validated.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: `${validated.cancelUrl}?order_id=${order.id}`,
  });

  // Store Stripe session ID on the order
  await db
    .update(orders)
    .set({
      stripeSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Check whether a webhook event has already been processed (idempotency).
 * Returns true if the event was already processed.
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await db
    .select({ id: stripeWebhookEvents.id })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.id, eventId))
    .limit(1);

  return existing.length > 0;
}

/**
 * Mark a webhook event as processed.
 */
async function markEventProcessed(
  eventId: string,
  eventType: string
): Promise<void> {
  await db
    .insert(stripeWebhookEvents)
    .values({ id: eventId, type: eventType })
    .onConflictDoNothing();
}

/**
 * Atomically decrement stock for all items in an order.
 * Must be called inside a transaction.
 */
async function decrementStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string
): Promise<void> {
  const items = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }
}

/**
 * Atomically restore stock for all items in an order (on cancel/refund).
 * Must be called inside a transaction.
 */
async function restoreStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string
): Promise<void> {
  const items = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }
}

/**
 * Increment the usageCount on a coupon after an order is confirmed.
 * Safe to call inside a transaction. Uses SQL increment to be race-condition safe.
 */
async function incrementCouponUsage(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderId: string
): Promise<void> {
  const [orderCoupon] = await tx
    .select({ couponId: orderCoupons.couponId })
    .from(orderCoupons)
    .where(eq(orderCoupons.orderId, orderId))
    .limit(1);

  if (!orderCoupon) return;

  await tx
    .update(coupons)
    .set({
      usageCount: sql`${coupons.usageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, orderCoupon.couponId));
}

export async function handleWebhookEvent(
  payload: string,
  signature: string
): Promise<WebhookResult> {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );

  // Idempotency: skip if already processed
  if (await isEventProcessed(event.id)) {
    return { action: "skipped" };
  }

  let result: WebhookResult = { action: "skipped" };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const [existing] = await db
          .select({ status: orders.status, userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (existing && existing.status === "pending") {
          await db.transaction(async (tx) => {
            await tx
              .update(orders)
              .set({
                status: "confirmed",
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            await decrementStock(tx, orderId);
            await incrementCouponUsage(tx, orderId);
          });

          result = {
            action: "confirmed",
            orderId,
            userId: existing.userId,
          };
        }
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        const [existing] = await db
          .select({ status: orders.status, userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        // Handle out-of-order: if checkout.session.completed hasn't arrived yet,
        // this event can also confirm the order
        if (existing && existing.status === "pending") {
          await db.transaction(async (tx) => {
            await tx
              .update(orders)
              .set({
                status: "confirmed",
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            await decrementStock(tx, orderId);
            await incrementCouponUsage(tx, orderId);
          });

          result = {
            action: "confirmed",
            orderId,
            userId: existing.userId,
          };
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        const [existing] = await db
          .select({ status: orders.status, userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        // Only cancel if still pending — stock was never decremented for pending orders
        if (existing && existing.status === "pending") {
          await db
            .update(orders)
            .set({
              status: "cancelled",
              stripePaymentIntentId: paymentIntent.id,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          result = {
            action: "cancelled",
            orderId,
            userId: existing.userId,
          };
        }
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (paymentIntentId) {
        const [existing] = await db
          .select({ id: orders.id, status: orders.status, userId: orders.userId })
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, paymentIntentId))
          .limit(1);

        if (existing) {
          const refundableStatuses = [
            "confirmed",
            "processing",
            "shipped",
          ] as const;
          if (
            refundableStatuses.includes(
              existing.status as (typeof refundableStatuses)[number]
            )
          ) {
            await db.transaction(async (tx) => {
              await tx
                .update(orders)
                .set({
                  status: "refunded",
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, existing.id));

              await restoreStock(tx, existing.id);
            });

            result = {
              action: "refunded",
              orderId: existing.id,
              userId: existing.userId,
            };
          }
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const [existing] = await db
          .select({ status: orders.status, userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        // Pending orders never had stock decremented, so no restore needed
        if (existing && existing.status === "pending") {
          await db
            .update(orders)
            .set({
              status: "cancelled",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          result = {
            action: "cancelled",
            orderId,
            userId: existing.userId,
          };
        }
      }
      break;
    }
  }

  // Mark event as processed after successful handling
  await markEventProcessed(event.id, event.type);

  return result;
}
