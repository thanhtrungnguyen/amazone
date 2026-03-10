"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { deleteCoupon, toggleCouponActive } from "./actions";
import { CouponFormDialog, type CouponFormData } from "./coupon-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CouponActionsCellProps {
  coupon: CouponFormData & { usageCount: number; isActive: boolean };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CouponActionsCell({
  coupon,
}: CouponActionsCellProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleToggle(): void {
    startTransition(async () => {
      const result = await toggleCouponActive(coupon.id!);
      if (result.success) {
        toast.success(
          coupon.isActive ? "Coupon deactivated" : "Coupon activated"
        );
      } else {
        toast.error(result.error ?? "Failed to toggle coupon");
      }
    });
  }

  function handleDelete(): void {
    const message =
      coupon.usageCount > 0
        ? `This coupon has been used ${coupon.usageCount} time(s). It will be deactivated instead of deleted. Continue?`
        : `Delete coupon "${coupon.code}"? This cannot be undone.`;

    if (!confirm(message)) return;

    startTransition(async () => {
      const result = await deleteCoupon(coupon.id!);
      if (result.success) {
        toast.success(result.error ?? "Coupon deleted");
      } else {
        toast.error(result.error ?? "Failed to delete coupon");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        className="text-gray-600 hover:bg-gray-100"
        aria-label={
          coupon.isActive
            ? `Deactivate coupon ${coupon.code}`
            : `Activate coupon ${coupon.code}`
        }
      >
        {coupon.isActive ? (
          <ToggleRight className="h-4 w-4" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
      </Button>

      <CouponFormDialog
        initialData={coupon}
        dialogTitle="Edit Coupon"
        dialogDescription={`Editing coupon ${coupon.code}.`}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Edit coupon ${coupon.code}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        aria-label={`Delete coupon ${coupon.code}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
