"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: OrderStatusSelectProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  function handleStatusUpdate(
    newStatus: string,
    shippingInfo?: { trackingNumber?: string; carrierName?: string }
  ): void {
    startTransition(async () => {
      const result = await updateSellerOrderStatus(orderId, newStatus, shippingInfo);
      if (result.success) {
        toast.success(
          `Order moved to ${STATUS_LABELS[newStatus] ?? newStatus}`
        );
        setShowShippingDialog(false);
        setTrackingNumber("");
        setCarrierName("");
      } else {
        toast.error(result.error ?? "Failed to update order status");
      }
    });
  }

  function handleChange(newStatus: string): void {
    if (newStatus === "shipped") {
      // Show dialog so seller can enter tracking info
      setShowShippingDialog(true);
      return;
    }
    handleStatusUpdate(newStatus);
  }

  function handleShippingSubmit(): void {
    const shippingInfo: { trackingNumber?: string; carrierName?: string } = {};
    const trimmedTracking = trackingNumber.trim();
    const trimmedCarrier = carrierName.trim();

    if (trimmedTracking) {
      shippingInfo.trackingNumber = trimmedTracking;
    }
    if (trimmedCarrier) {
      shippingInfo.carrierName = trimmedCarrier;
    }

    handleStatusUpdate("shipped", shippingInfo);
  }

  if (isTerminal) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  return (
    <>
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

      {/* Shipping info dialog — shown when seller selects "shipped" */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ship Order</DialogTitle>
            <DialogDescription>
              Enter the tracking number and carrier name for this shipment.
              These fields are optional but recommended so the customer can
              track their package.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="carrier-name">Carrier Name</Label>
              <Input
                id="carrier-name"
                placeholder="e.g. UPS, FedEx, USPS, DHL"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                disabled={isPending}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking-number">Tracking Number</Label>
              <Input
                id="tracking-number"
                placeholder="e.g. 1Z999AA10123456784"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={isPending}
                maxLength={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShippingDialog(false);
                setTrackingNumber("");
                setCarrierName("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleShippingSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Shipping...
                </>
              ) : (
                "Mark as Shipped"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
