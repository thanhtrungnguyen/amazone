import { z } from "zod";

export const checkoutSessionSchema = z.object({
  shippingName: z.string().min(1).max(255),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1).max(255),
  shippingCountry: z.string().length(2),
  shippingZip: z.string().min(1).max(20),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

/** Returned by handleWebhookEvent so the caller can trigger side-effects (e.g. email). */
export interface WebhookResult {
  /** The action that was taken, or "skipped" if idempotency/guard prevented processing. */
  action: "confirmed" | "cancelled" | "refunded" | "skipped";
  orderId?: string;
  userId?: string;
}
