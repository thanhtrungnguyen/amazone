"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check } from "lucide-react";
import { QuantitySelector } from "@amazone/shared-ui";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@amazone/shared-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  VariantOption,
  ProductVariantInfo,
} from "@amazone/products";

interface VariantSelectorProps {
  product: {
    id: string;
    name: string;
    price: number;
    images?: (string | null)[] | null;
    stock: number;
  };
  options: VariantOption[];
  variants: ProductVariantInfo[];
}

/**
 * Find the variant that matches the current selection exactly.
 * Returns undefined if the selection is incomplete or no match is found.
 */
function findMatchingVariant(
  variants: ProductVariantInfo[],
  selectedValues: Record<string, string>
): ProductVariantInfo | undefined {
  const selectedOptionIds = Object.keys(selectedValues);
  return variants.find((variant) => {
    if (variant.combinations.length !== selectedOptionIds.length) return false;
    return variant.combinations.every(
      (combo) => selectedValues[combo.optionId] === combo.valueId
    );
  });
}

/**
 * Determine which values are available given the current partial selection.
 * A value is available if there exists at least one active, in-stock variant
 * that includes that value along with all other currently selected values.
 */
function getAvailableValues(
  variants: ProductVariantInfo[],
  selectedValues: Record<string, string>,
  optionId: string
): Set<string> {
  const available = new Set<string>();
  const otherSelections = { ...selectedValues };
  delete otherSelections[optionId];

  for (const variant of variants) {
    if (!variant.isActive) continue;

    // Check that the variant matches all other selected options
    const matchesOthers = Object.entries(otherSelections).every(
      ([optId, valId]) =>
        variant.combinations.some(
          (c) => c.optionId === optId && c.valueId === valId
        )
    );

    if (matchesOthers) {
      const combo = variant.combinations.find((c) => c.optionId === optionId);
      if (combo) {
        available.add(combo.valueId);
      }
    }
  }

  return available;
}

export function VariantSelector({
  product,
  options,
  variants,
}: VariantSelectorProps): React.ReactElement {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
    {}
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  const selectedVariant = useMemo(
    () => findMatchingVariant(variants, selectedValues),
    [variants, selectedValues]
  );

  const isSelectionComplete = options.length === Object.keys(selectedValues).length;

  // Determine effective price and stock based on selected variant
  const effectivePrice = selectedVariant?.priceInCents ?? product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleSelectValue = useCallback(
    (optionId: string, valueId: string) => {
      setSelectedValues((prev) => {
        if (prev[optionId] === valueId) {
          // Deselect
          const next = { ...prev };
          delete next[optionId];
          return next;
        }
        return { ...prev, [optionId]: valueId };
      });
    },
    []
  );

  const handleAddToCart = useCallback(() => {
    if (!isSelectionComplete || !selectedVariant) {
      toast.error("Please select all options");
      return;
    }

    if (effectiveStock === 0) {
      toast.error("This variant is out of stock");
      return;
    }

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      price: effectivePrice,
      image: product.images?.[0] ?? null,
      quantity,
    });

    setAdded(true);
    toast.success(`Added ${quantity} item(s) to cart`);
    setTimeout(() => setAdded(false), 2000);
  }, [
    isSelectionComplete,
    selectedVariant,
    effectiveStock,
    effectivePrice,
    addItem,
    product,
    quantity,
  ]);

  return (
    <div className="flex flex-col gap-4">
      {/* Variant option groups */}
      {options.map((option) => {
        const availableValues = getAvailableValues(
          variants,
          selectedValues,
          option.id
        );

        return (
          <div key={option.id} className="space-y-2">
            <span className="text-sm font-medium">
              {option.name}
              {selectedValues[option.id] && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {option.values.find(
                    (v) => v.id === selectedValues[option.id]
                  )?.value ?? ""}
                </span>
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const isSelected = selectedValues[option.id] === val.id;
                const isAvailable = availableValues.has(val.id);

                // Check if this specific value has any in-stock variant
                const hasStock = variants.some(
                  (v) =>
                    v.isActive &&
                    v.stock > 0 &&
                    v.combinations.some(
                      (c) => c.optionId === option.id && c.valueId === val.id
                    )
                );

                return (
                  <button
                    key={val.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectValue(option.id, val.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isAvailable && hasStock
                          ? "border-border bg-background hover:border-primary hover:bg-accent"
                          : isAvailable && !hasStock
                            ? "border-border bg-background text-muted-foreground line-through hover:border-primary"
                            : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                    )}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Price display for selected variant */}
      {isSelectionComplete && selectedVariant && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {formatPrice(effectivePrice)}
          </span>
          {selectedVariant.priceInCents !== null &&
            selectedVariant.priceInCents !== product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
        </div>
      )}

      {/* Stock indicator for selected variant */}
      {isSelectionComplete && selectedVariant && (
        <div className="text-sm">
          {effectiveStock > 0 ? (
            <span className="text-green-600">
              In Stock ({effectiveStock} available)
            </span>
          ) : (
            <span className="text-red-600">Out of Stock</span>
          )}
          {selectedVariant.sku && (
            <Badge variant="outline" className="ml-2">
              SKU: {selectedVariant.sku}
            </Badge>
          )}
        </div>
      )}

      {!isSelectionComplete && options.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Please select{" "}
          {options
            .filter((o) => !selectedValues[o.id])
            .map((o) => o.name.toLowerCase())
            .join(" and ")}
        </p>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            max={effectiveStock}
            disabled={!isSelectionComplete || effectiveStock === 0}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={!isSelectionComplete || effectiveStock === 0}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              handleAddToCart();
              openCart();
            }}
            disabled={!isSelectionComplete || effectiveStock === 0}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
