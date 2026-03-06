import Image from "next/image";
import { formatPrice } from "@amazone/shared-utils";
import { RatingStars } from "./rating-stars";

interface ProductCardProps {
  name: string;
  slug: string;
  priceInCents: number;
  compareAtPriceInCents?: number;
  image?: string | null;
  rating?: number;
  reviewCount?: number;
  badge?: string;
}

export function ProductCard({
  name,
  slug,
  priceInCents,
  compareAtPriceInCents,
  image,
  rating,
  reviewCount,
  badge,
}: ProductCardProps): React.ReactElement {
  const hasDiscount =
    compareAtPriceInCents !== undefined &&
    compareAtPriceInCents > priceInCents;
  const discountPercent = hasDiscount
    ? Math.round(
        ((compareAtPriceInCents - priceInCents) / compareAtPriceInCents) * 100
      )
    : 0;

  return (
    <a
      href={`/products/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
          </div>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {badge}
          </span>
        )}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600">
          {name}
        </h3>

        {rating !== undefined && (
          <RatingStars rating={rating / 100} count={reviewCount} size="sm" />
        )}

        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(priceInCents)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(compareAtPriceInCents)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
