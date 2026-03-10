"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type CreateAddressInput,
} from "@amazone/users";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function getMyAddresses(): Promise<
  | { success: true; data: Awaited<ReturnType<typeof getAddresses>> }
  | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const data = await getAddresses(session.user.id);
  return { success: true, data };
}

export async function addAddress(
  input: CreateAddressInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    await createAddress(session.user.id, input);
    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create address.";
    return { success: false, error: message };
  }
}

export async function editAddress(
  addressId: string,
  input: Omit<CreateAddressInput, "isDefault"> & { isDefault?: boolean }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    await updateAddress(addressId, session.user.id, input);
    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update address.";
    return { success: false, error: message };
  }
}

export async function removeAddress(addressId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    await deleteAddress(addressId, session.user.id);
    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete address.";
    return { success: false, error: message };
  }
}

export async function makeDefaultAddress(
  addressId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  try {
    await setDefaultAddress(addressId, session.user.id);
    revalidatePath("/profile/addresses");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set default address.";
    return { success: false, error: message };
  }
}
