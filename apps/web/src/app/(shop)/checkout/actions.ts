"use server";

import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@amazone/checkout";
import type { CheckoutResult } from "@amazone/checkout";

interface CheckoutFormInput {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string;
  shippingCountry: string;
  shippingZip: string;
}

type CheckoutActionResult =
  | { success: true; data: CheckoutResult }
  | { success: false; error: string };

export async function submitCheckout(
  input: CheckoutFormInput
): Promise<CheckoutActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to checkout." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const result = await createCheckoutSession(session.user.id, {
      ...input,
      successUrl: `${baseUrl}/checkout/success`,
      cancelUrl: `${baseUrl}/checkout/cancel`,
    });

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong during checkout.";
    return { success: false, error: message };
  }
}
