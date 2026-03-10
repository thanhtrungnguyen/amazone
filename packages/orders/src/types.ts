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

// ─── Order Events ────────────────────────────────────────────────────────────

export const ORDER_EVENT_TYPES = [
  "created",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
] as const;

export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];

export const addOrderEventSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(ORDER_EVENT_TYPES),
  message: z.string().min(1).max(1000),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional(),
});

export type AddOrderEventInput = z.infer<typeof addOrderEventSchema>;

export interface OrderEvent {
  id: string;
  orderId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
