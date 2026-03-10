"use client";

import { useTransition, useState, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCoupon, updateCoupon } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CouponFormData {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderCents: number | null;
  maxUsages: number | null;
  expiresAt: string | null; // ISO date string for the input
}

interface CouponFormProps {
  initialData?: CouponFormData;
  trigger: React.ReactNode;
  dialogTitle: string;
  dialogDescription: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CouponFormDialog({
  initialData,
  trigger,
  dialogTitle,
  dialogDescription,
}: CouponFormProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(initialData?.code ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    initialData?.discountType ?? "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    initialData?.discountValue?.toString() ?? ""
  );
  const [minOrderCents, setMinOrderCents] = useState(
    initialData?.minOrderCents != null
      ? (initialData.minOrderCents / 100).toString()
      : ""
  );
  const [maxUsages, setMaxUsages] = useState(
    initialData?.maxUsages?.toString() ?? ""
  );
  const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt ?? "");

  const resetForm = useCallback((): void => {
    if (!initialData) {
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMinOrderCents("");
      setMaxUsages("");
      setExpiresAt("");
    }
  }, [initialData]);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    const parsedValue = parseInt(discountValue, 10);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      toast.error("Discount value must be a positive number");
      return;
    }

    if (discountType === "percentage" && parsedValue > 100) {
      toast.error("Percentage discount cannot exceed 100");
      return;
    }

    const minOrder = minOrderCents.trim()
      ? Math.round(parseFloat(minOrderCents) * 100)
      : null;

    if (minOrder !== null && (isNaN(minOrder) || minOrder < 0)) {
      toast.error("Minimum order must be a non-negative amount");
      return;
    }

    const maxUse = maxUsages.trim() ? parseInt(maxUsages, 10) : null;
    if (maxUse !== null && (isNaN(maxUse) || maxUse <= 0)) {
      toast.error("Max usages must be a positive number");
      return;
    }

    const expiry = expiresAt ? new Date(expiresAt) : null;

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: parsedValue,
      minOrderCents: minOrder,
      maxUsages: maxUse,
      expiresAt: expiry,
    };

    startTransition(async () => {
      const result = initialData?.id
        ? await updateCoupon(initialData.id, payload)
        : await createCoupon(payload);

      if (result.success) {
        toast.success(
          initialData?.id
            ? result.error ?? "Coupon updated successfully"
            : "Coupon created successfully"
        );
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Code</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 uppercase"
                required
                disabled={isPending}
                maxLength={50}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCode(generateCode())}
                disabled={isPending}
              >
                Generate
              </Button>
            </div>
          </div>

          {/* Discount Type + Value */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-type">Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) =>
                  setDiscountType(v as "percentage" | "fixed")
                }
                disabled={isPending}
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-value">
                {discountType === "percentage"
                  ? "Discount (%)"
                  : "Discount (cents)"}
              </Label>
              <Input
                id="coupon-value"
                type="number"
                min={1}
                max={discountType === "percentage" ? 100 : undefined}
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Min Order + Max Uses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-min-order">Min Order ($, optional)</Label>
              <Input
                id="coupon-min-order"
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 25.00"
                value={minOrderCents}
                onChange={(e) => setMinOrderCents(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-max-uses">Max Uses (optional)</Label>
              <Input
                id="coupon-max-uses"
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={maxUsages}
                onChange={(e) => setMaxUsages(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="coupon-expires">Expiry Date (optional)</Label>
            <Input
              id="coupon-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !code.trim()}>
              {isPending
                ? initialData?.id
                  ? "Updating..."
                  : "Creating..."
                : initialData?.id
                  ? "Update Coupon"
                  : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
