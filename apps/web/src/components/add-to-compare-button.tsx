"use client";

import { GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/compare-store";
import { cn } from "@/lib/utils";

interface AddToCompareButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  };
  className?: string;
}

export function AddToCompareButton({
  product,
  className,
}: AddToCompareButtonProps): React.ReactElement {
  const isInCompare = useCompareStore((s) => s.isInCompare(product.id));
  const addProduct = useCompareStore((s) => s.addProduct);
  const removeProduct = useCompareStore((s) => s.removeProduct);

  const handleToggle = (): void => {
    if (isInCompare) {
      removeProduct(product.id);
    } else {
      addProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={
        isInCompare
          ? `Remove ${product.name} from comparison`
          : `Add ${product.name} to comparison`
      }
      className={cn(
        "transition-colors",
        isInCompare &&
          "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700",
        className
      )}
    >
      <GitCompareArrows className="h-4 w-4" />
    </Button>
  );
}
