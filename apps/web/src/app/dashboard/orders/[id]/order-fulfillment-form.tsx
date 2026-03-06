"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck } from "lucide-react";
import { type OrderStatus, ORDER_STATUSES } from "@amazone/shared-utils";

const fulfillmentStatuses: { value: OrderStatus; label: string }[] =
  ORDER_STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));

const fulfillmentSchema = z.object({
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]),
  trackingNumber: z.string().max(100).optional(),
});

type FulfillmentFormData = z.infer<typeof fulfillmentSchema>;

interface OrderFulfillmentFormProps {
  currentStatus: OrderStatus;
  currentTrackingNumber: string | null;
}

export function OrderFulfillmentForm({
  currentStatus,
  currentTrackingNumber,
}: OrderFulfillmentFormProps): React.ReactElement {
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, control } = useForm<FulfillmentFormData>({
    resolver: zodResolver(fulfillmentSchema),
    defaultValues: {
      status: currentStatus,
      trackingNumber: currentTrackingNumber ?? "",
    },
  });

  async function onSubmit(data: FulfillmentFormData): Promise<void> {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsUpdating(false);
    toast.success("Order updated", {
      description: `Status changed to "${data.status}"${
        data.trackingNumber ? ` with tracking ${data.trackingNumber}` : ""
      }.`,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="order-status">Order Status</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="order-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {fulfillmentStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tracking-number">Tracking Number</Label>
        <Input
          id="tracking-number"
          placeholder="e.g. 1Z999AA10123456784"
          {...register("trackingNumber")}
        />
      </div>

      <Button
        type="submit"
        disabled={isUpdating}
        className="w-full"
      >
        <Truck className="mr-2 h-4 w-4" aria-hidden="true" />
        {isUpdating ? "Updating..." : "Update Status"}
      </Button>
    </form>
  );
}
