import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  variantId: z.string().uuid().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  variantId: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[] | null;
    stock: number;
  };
  variant?: {
    id: string;
    sku: string | null;
    priceInCents: number | null;
    stock: number;
  } | null;
}

export interface CartSummary {
  items: CartItemWithProduct[];
  totalItems: number;
  totalInCents: number;
}
