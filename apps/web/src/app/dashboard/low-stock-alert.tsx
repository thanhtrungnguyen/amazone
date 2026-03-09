import Link from "next/link";
import { TriangleAlert, PackageX } from "lucide-react";
import { getLowStockProducts, LOW_STOCK_THRESHOLD } from "@amazone/products";
import type { LowStockProduct } from "@amazone/products";

interface Props {
  sellerId: string;
}

/**
 * Server component.  Queries the DB for low-stock products belonging to this
 * seller and renders a warning banner.  Renders nothing when all products have
 * stock > LOW_STOCK_THRESHOLD.
 */
export default async function LowStockAlert({
  sellerId,
}: Props): Promise<React.ReactElement | null> {
  const result = await getLowStockProducts(sellerId);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  const items = result.data;
  const outOfStock = items.filter((p) => p.stock === 0);
  const lowStock = items.filter((p) => p.stock > 0);

  // Choose the banner colour based on the most severe state present.
  const hasOutOfStock = outOfStock.length > 0;

  return (
    <div
      role="alert"
      className={[
        "mb-6 rounded-lg border p-4",
        hasOutOfStock
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
      ].join(" ")}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        {hasOutOfStock ? (
          <PackageX
            className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        ) : (
          <TriangleAlert
            className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
        )}
        <p
          className={[
            "text-sm font-semibold",
            hasOutOfStock
              ? "text-red-800 dark:text-red-300"
              : "text-amber-800 dark:text-amber-300",
          ].join(" ")}
        >
          {buildHeadline(outOfStock.length, lowStock.length)}
        </p>
      </div>

      {/* Product list */}
      <ul className="space-y-1.5">
        {items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </ul>

      {/* Footer hint */}
      <p
        className={[
          "mt-3 text-xs",
          hasOutOfStock
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400",
        ].join(" ")}
      >
        Products with stock &le; {LOW_STOCK_THRESHOLD} are shown here. Update
        their stock levels to keep them available to customers.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductRow({ product }: { product: LowStockProduct }): React.ReactElement {
  const isOutOfStock = product.stock === 0;

  return (
    <li className="flex items-center justify-between gap-4 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        {/* Severity dot */}
        <span
          aria-hidden="true"
          className={[
            "inline-block h-2 w-2 shrink-0 rounded-full",
            isOutOfStock ? "bg-red-500" : "bg-amber-500",
          ].join(" ")}
        />

        {/* Product name */}
        <span
          className={[
            "truncate font-medium",
            isOutOfStock
              ? "text-red-800 dark:text-red-300"
              : "text-amber-800 dark:text-amber-300",
          ].join(" ")}
        >
          {product.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* Stock badge */}
        <span
          className={[
            "rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums",
            isOutOfStock
              ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
          ].join(" ")}
        >
          {isOutOfStock ? "Out of stock" : `${product.stock} left`}
        </span>

        {/* Edit link */}
        <Link
          href={`/dashboard/products/${product.id}/edit`}
          className={[
            "text-xs underline underline-offset-2 hover:no-underline",
            isOutOfStock
              ? "text-red-700 dark:text-red-400"
              : "text-amber-700 dark:text-amber-400",
          ].join(" ")}
        >
          Update
        </Link>
      </div>
    </li>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHeadline(outCount: number, lowCount: number): string {
  const parts: string[] = [];

  if (outCount > 0) {
    parts.push(
      `${outCount} product${outCount !== 1 ? "s" : ""} out of stock`
    );
  }
  if (lowCount > 0) {
    parts.push(
      `${lowCount} product${lowCount !== 1 ? "s" : ""} running low on stock`
    );
  }

  const joined = parts.join(" and ");
  // Capitalise first letter
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}
