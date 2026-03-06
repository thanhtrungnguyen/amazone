"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  className?: string;
}

export function WishlistButton({
  productId,
  name,
  slug,
  price,
  image,
  className,
}: WishlistButtonProps): React.ReactElement {
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(productId));
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);

  const handleToggle = (): void => {
    if (isInWishlist) {
      removeItem(productId);
      toast.success(`"${name}" removed from wishlist`);
    } else {
      addItem({ productId, name, slug, price, image });
      toast.success(`"${name}" added to wishlist`);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={isInWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={cn(
        "transition-colors",
        isInWishlist && "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4", isInWishlist && "fill-current")}
      />
    </Button>
  );
}
