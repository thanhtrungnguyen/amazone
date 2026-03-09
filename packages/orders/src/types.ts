import { z } from "zod";
import { ORDER_STATUSES } from "@amazone/shared-utils";

export const createOrderSchema = z.object({
  shippingName: z.string().min(1).max(255),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1).max(255),
  shippingState: z.string().max(255).optional(),
  shippingCountry: z.string().length(2),
  shippingZip: z.string().min(1).max(20),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const requestReturnSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(10, "errors.return_reason_too_short").max(1000, "errors.return_reason_too_long"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type RequestReturnInput = z.infer<typeof requestReturnSchema>;

export interface OrderWithItems {
  id: string;
  status: string;
  totalInCents: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingCountry: string;
  shippingZip: string;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    priceInCents: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[] | null;
    };
  }[];
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
