import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[] | null;
    stock: number;
  };
}

export interface CartSummary {
  items: CartItemWithProduct[];
  totalItems: number;
  totalInCents: number;
}
