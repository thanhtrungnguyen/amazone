import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@amazone/checkout";
import { logger } from "@amazone/shared-utils";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logger.warn("Stripe webhook request missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  try {
    await handleWebhookEvent(payload, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    logger.error({ err: error }, "Stripe webhook processing failed");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
