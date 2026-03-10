"use server";

import { db, addresses } from "@amazone/db";
import { eq, and, count } from "drizzle-orm";
import {
  createAddressSchema,
  updateAddressSchema,
  MAX_ADDRESSES_PER_USER,
  type CreateAddressInput,
  type UpdateAddressInput,
  type Address,
} from "./address-types";

export async function getAddresses(userId: string): Promise<Address[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(addresses.createdAt);

  return rows;
}

export async function getDefaultAddress(
  userId: string
): Promise<Address | undefined> {
  return db.query.addresses.findFirst({
    where: and(
      eq(addresses.userId, userId),
      eq(addresses.isDefault, true)
    ),
  });
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  const validated = createAddressSchema.parse(input);

  // Check address limit
  const [result] = await db
    .select({ value: count() })
    .from(addresses)
    .where(eq(addresses.userId, userId));

  if (result && result.value >= MAX_ADDRESSES_PER_USER) {
    throw new Error(
      `You can save a maximum of ${MAX_ADDRESSES_PER_USER} addresses.`
    );
  }

  // If this is the first address or marked as default, handle default logic
  const shouldBeDefault = validated.isDefault || (result?.value === 0);

  if (shouldBeDefault) {
    // Clear existing default
    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
  }

  const [address] = await db
    .insert(addresses)
    .values({
      userId,
      label: validated.label,
      fullName: validated.fullName,
      streetAddress: validated.streetAddress,
      city: validated.city,
      state: validated.state ?? null,
      zipCode: validated.zipCode,
      country: validated.country,
      phone: validated.phone ?? null,
      isDefault: shouldBeDefault,
    })
    .returning();

  return address;
}

export async function updateAddress(
  addressId: string,
  userId: string,
  input: Omit<UpdateAddressInput, "id">
): Promise<Address> {
  const validated = updateAddressSchema.omit({ id: true }).parse(input);

  // Verify ownership
  const existing = await db.query.addresses.findFirst({
    where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
  });

  if (!existing) {
    throw new Error("Address not found.");
  }

  if (validated.isDefault) {
    // Clear existing default
    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
  }

  const [address] = await db
    .update(addresses)
    .set({
      ...validated,
      state: validated.state ?? existing.state,
      phone: validated.phone ?? existing.phone,
      updatedAt: new Date(),
    })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();

  return address;
}

export async function deleteAddress(
  addressId: string,
  userId: string
): Promise<void> {
  const existing = await db.query.addresses.findFirst({
    where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
  });

  if (!existing) {
    throw new Error("Address not found.");
  }

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

  // If the deleted address was the default, set the first remaining as default
  if (existing.isDefault) {
    const remaining = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.createdAt)
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, remaining[0].id));
    }
  }
}

export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<Address> {
  // Verify ownership
  const existing = await db.query.addresses.findFirst({
    where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
  });

  if (!existing) {
    throw new Error("Address not found.");
  }

  // Clear all defaults for this user
  await db
    .update(addresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));

  // Set the new default
  const [address] = await db
    .update(addresses)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();

  return address;
}
