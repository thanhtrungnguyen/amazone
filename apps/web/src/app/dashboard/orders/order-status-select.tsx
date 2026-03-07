"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSellerOrderStatus } from "./actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/**
 * Valid forward transitions for the fulfillment workflow.
 * Any status can also transition to "cancelled".
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  function handleChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateSellerOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(
          `Order moved to ${STATUS_LABELS[newStatus] ?? newStatus}`
        );
      } else {
        toast.error(result.error ?? "Failed to update order status");
      }
    });
  }

  if (isTerminal) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  return (
    <div className="relative">
      <Select
        value={currentStatus}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger
          className="w-[140px]"
          aria-label={`Change order status, currently ${STATUS_LABELS[currentStatus] ?? currentStatus}`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus} disabled>
            {STATUS_LABELS[currentStatus] ?? currentStatus}
          </SelectItem>
          {allowedNext.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
