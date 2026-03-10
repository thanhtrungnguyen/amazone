import { z } from "zod";

export const MAX_ADDRESSES_PER_USER = 5;

export const addressSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(50, "Label is too long"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Name is too long"),
  streetAddress: z
    .string()
    .min(1, "Street address is required")
    .max(500, "Address is too long"),
  city: z
    .string()
    .min(1, "City is required")
    .max(255, "City name is too long"),
  state: z.string().max(255, "State is too long").nullable().optional(),
  zipCode: z
    .string()
    .min(1, "ZIP / postal code is required")
    .max(20, "ZIP code is too long"),
  country: z
    .string()
    .length(2, "Country code must be 2 characters"),
  phone: z.string().max(30, "Phone is too long").nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = addressSchema;

export const updateAddressSchema = addressSchema.partial().extend({
  id: z.string().uuid("Invalid address ID"),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string | null;
  zipCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
