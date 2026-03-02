"use server";

import Stripe from "stripe";
import { getCart } from "@amazone/cart";
import { createOrder } from "@amazone/orders";
import { db, products, orders } from "@amazone/db";
import { eq, inArray } from "drizzle-orm";
import {
  checkoutSessionSchema,
  type CheckoutSessionInput,
  type CheckoutResult,
} from "./types";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  return new Stripe(key);
}

export async function createCheckoutSession(
  userId: string,
  input: CheckoutSessionInput
): Promise<CheckoutResult> {
  const validated = checkoutSessionSchema.parse(input);
  const stripe = getStripe();
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

  // Create order with verified prices
  const order = await createOrder(
    userId,
    {
      shippingName: validated.shippingName,
      shippingAddress: validated.shippingAddress,
      shippingCity: validated.shippingCity,
      shippingCountry: validated.shippingCountry,
      shippingZip: validated.shippingZip,
    },
    cart.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      priceInCents: stockMap.get(item.product.id)!.price,
    }))
  );

  // Stub mode: if Stripe is not configured, return a stub result
  if (!stripe) {
    return {
      sessionId: `stub_${order.id}`,
      url: validated.successUrl,
    };
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: undefined, // Will be set from auth
    line_items: cart.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images: item.product.images?.slice(0, 1) ?? [],
        },
        unit_amount: stockMap.get(item.product.id)!.price,
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId: order.id,
      userId,
    },
    success_url: validated.successUrl,
    cancel_url: validated.cancelUrl,
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

export async function handleWebhookEvent(
  payload: string,
  signature: string
): Promise<void> {
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db
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
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }
      break;
    }
  }
}
