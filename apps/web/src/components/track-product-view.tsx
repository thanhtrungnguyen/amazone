"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface TrackProductViewProps {
  productId: string;
}

export function TrackProductView({
  productId,
}: TrackProductViewProps): null {
  const { addProduct } = useRecentlyViewed();

  useEffect(() => {
    addProduct(productId);
  }, [productId, addProduct]);

  return null;
}
