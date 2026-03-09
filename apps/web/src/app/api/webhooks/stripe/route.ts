import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent, type WebhookResult } from "@amazone/checkout";
import { db, orders, orderItems, products, users } from "@amazone/db";
import { eq } from "drizzle-orm";
import { logger } from "@amazone/shared-utils";
import {
  sendOrderConfirmation,
  sendShippingUpdate,
  sendSellerOrderNotification,
} from "@/lib/email";
import { webhookLimiter, withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimited = await withRateLimit(request, webhookLimiter, 50);
  if (rateLimited) return rateLimited;

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logger.warn("Stripe webhook request missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let result: WebhookResult;

  try {
    result = await handleWebhookEvent(payload, signature);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    logger.error({ err: error }, "Stripe webhook processing failed");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Send email notifications after successful webhook processing.
  // Wrapped in try/catch so email failures never break the webhook response.
  if (result.action !== "skipped" && result.orderId) {
    try {
      await sendWebhookEmail(result);
    } catch (emailError) {
      logger.error(
        { err: emailError, orderId: result.orderId, action: result.action },
        "Failed to send webhook email notification"
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function sendWebhookEmail(result: WebhookResult): Promise<void> {
  if (!result.orderId || !result.userId) return;

  // Fetch the user's name and email
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);

  if (!user) return;

  if (result.action === "confirmed") {
    // Fetch order total and items for the confirmation email
    const [order] = await db
      .select({ totalInCents: orders.totalInCents })
      .from(orders)
      .where(eq(orders.id, result.orderId))
      .limit(1);

    const items = await db
      .select({
        quantity: orderItems.quantity,
        priceInCents: orderItems.priceInCents,
        name: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, result.orderId));

    if (order) {
      await sendOrderConfirmation({
        to: user.email,
        customerName: user.name,
        orderId: result.orderId,
        totalInCents: order.totalInCents,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceInCents: item.priceInCents,
        })),
      });

      // Notify each seller who has items in this order
      await sendSellerOrderNotification(result.orderId);
    }
  } else if (result.action === "refunded") {
    await sendShippingUpdate({
      to: user.email,
      customerName: user.name,
      orderId: result.orderId,
      status: "refunded",
    });
  }
}
