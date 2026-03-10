"use server";

import { auth } from "@/lib/auth";
import { createCheckoutSession, applyCoupon } from "@amazone/checkout";
import type { CheckoutResult, ApplyCouponResult } from "@amazone/checkout";
import {
  getAddresses,
  createAddress,
  type Address,
  type CreateAddressInput,
} from "@amazone/users";

interface CheckoutFormInput {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string;
  shippingCountry: string;
  shippingZip: string;
  couponCode?: string;
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

/**
 * Server action that validates a coupon code from the checkout form.
 * Called on the client when the user clicks "Apply" — does not increment usageCount.
 */
export async function validateCouponCode(
  code: string,
  orderTotalCents: number
): Promise<ApplyCouponResult> {
  return applyCoupon(code, orderTotalCents);
}

/**
 * Fetch the current user's saved addresses for the checkout address selector.
 */
export async function fetchSavedAddresses(): Promise<
  | { success: true; data: Address[] }
  | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in." };
  }

  const data = await getAddresses(session.user.id);
  return { success: true, data };
}

/**
 * Save the shipping address entered during checkout to the user's address book.
 */
export async function saveCheckoutAddress(
  input: CreateAddressInput
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in." };
  }

  try {
    await createAddress(session.user.id, input);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save address.";
    return { success: false, error: message };
  }
}
