import { formatPrice, formatPriceVN } from "@amazone/shared-utils";

interface PriceDisplayProps {
  priceInCents: number;
  originalPriceInCents?: number;
  locale?: "en" | "vi";
  className?: string;
}

export function PriceDisplay({
  priceInCents,
  originalPriceInCents,
  locale = "en",
  className,
}: PriceDisplayProps): React.ReactElement {
  const formatter = locale === "vi" ? formatPriceVN : formatPrice;
  const hasDiscount =
    originalPriceInCents !== undefined &&
    originalPriceInCents > priceInCents;

  return (
    <div className={`flex items-baseline gap-2 ${className ?? ""}`}>
      <span className="text-lg font-bold text-gray-900">
        {formatter(priceInCents)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-gray-500 line-through">
          {formatter(originalPriceInCents)}
        </span>
      )}
    </div>
  );
}
