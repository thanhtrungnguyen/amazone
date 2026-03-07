"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleProductActive, toggleProductFeatured } from "./actions";

interface ProductTogglesProps {
  productId: string;
  isActive: boolean;
  isFeatured: boolean;
}

export function ProductToggles({
  productId,
  isActive,
  isFeatured,
}: ProductTogglesProps): React.ReactElement {
  const [isActivePending, startActiveTransition] = useTransition();
  const [isFeaturedPending, startFeaturedTransition] = useTransition();

  function handleActiveToggle(): void {
    startActiveTransition(async () => {
      const result = await toggleProductActive(productId, !isActive);
      if (result.success) {
        toast.success(isActive ? "Product deactivated" : "Product activated");
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  function handleFeaturedToggle(): void {
    startFeaturedTransition(async () => {
      const result = await toggleProductFeatured(productId, !isFeatured);
      if (result.success) {
        toast.success(
          isFeatured ? "Removed from featured" : "Added to featured"
        );
      } else {
        toast.error(result.error ?? "Failed to update featured status");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleActiveToggle}
        disabled={isActivePending}
        className="min-w-[80px] text-xs"
        aria-label={isActive ? "Deactivate product" : "Activate product"}
      >
        {isActivePending ? "..." : isActive ? "Active" : "Inactive"}
      </Button>
      <Button
        variant={isFeatured ? "default" : "outline"}
        size="sm"
        onClick={handleFeaturedToggle}
        disabled={isFeaturedPending}
        className="min-w-[80px] text-xs"
        aria-label={
          isFeatured ? "Remove from featured" : "Mark as featured"
        }
      >
        {isFeaturedPending ? "..." : isFeatured ? "Featured" : "Not Featured"}
      </Button>
    </div>
  );
}
