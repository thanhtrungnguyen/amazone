import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  price: z.number().int().positive(), // in cents
  compareAtPrice: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  inStock: z.boolean().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "rating", "name", "featured"])
    .default("newest"),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ─── Paginated product listing ────────────────────────────────────────────────

export interface PaginatedProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  categoryId: string | null;
}

export interface PaginatedProductsResult {
  products: PaginatedProductItem[];
  nextCursor: string | null;
  total: number;
}

export interface PaginatedProductsInput {
  cursor?: string;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "rating" | "name" | "featured";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isActive?: boolean;
}

// ─── Related Products ─────────────────────────────────────────────────────────

export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
}

// ─── Low-Stock Alerts ─────────────────────────────────────────────────────────

/** The stock level at or below which a product is considered low. */
export const LOW_STOCK_THRESHOLD = 5;

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  sellerId: string;
}

/**
 * Callback type for the email sender injected by the caller.
 * Keeping this as a parameter ensures @amazone/products never imports from
 * apps/web — package boundary rule.
 */
export type SendEmailFn = (params: {
  to: string;
  subject: string;
  html: string;
}) => Promise<void>;

/**
 * Build the HTML body for a low-stock alert email for one seller.
 * Exported so the apps/web email utility can call it when constructing the
 * actual transport message — the template lives here in the domain package
 * while the SMTP transport stays in apps/web.
 */
export function buildLowStockEmailHtml(params: {
  sellerName: string;
  items: LowStockProduct[];
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const itemRows = params.items
    .map((item) => {
      const stockLabel =
        item.stock === 0
          ? `<span style="color:#dc2626;font-weight:600">Out of stock</span>`
          : `<span style="color:#d97706;font-weight:600">${item.stock} left</span>`;
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2;text-align:center">${stockLabel}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #fee2e2;text-align:right">
          <a href="${siteUrl}/dashboard/products/${item.id}/edit"
             style="color:#3b82f6;text-decoration:none;font-size:13px">Update stock</a>
        </td>
      </tr>`;
    })
    .join("");

  const outOfStockCount = params.items.filter((i) => i.stock === 0).length;
  const lowCount = params.items.length - outOfStockCount;

  const summaryParts: string[] = [];
  if (outOfStockCount > 0) {
    summaryParts.push(
      `<strong>${outOfStockCount}</strong> product${outOfStockCount !== 1 ? "s" : ""} out of stock`
    );
  }
  if (lowCount > 0) {
    summaryParts.push(
      `<strong>${lowCount}</strong> product${lowCount !== 1 ? "s" : ""} running low`
    );
  }

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#7f1d1d;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">Low Stock Alert</h1>
      </div>
      <div style="border:1px solid #fecaca;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">
        <p style="font-size:16px">Hi ${params.sellerName},</p>
        <p>The following products need your attention: ${summaryParts.join(" and ")}.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#fef2f2">
              <th style="padding:10px 8px;text-align:left;font-size:13px;text-transform:uppercase;color:#64748b">Product</th>
              <th style="padding:10px 8px;text-align:center;font-size:13px;text-transform:uppercase;color:#64748b">Stock</th>
              <th style="padding:10px 8px;text-align:right;font-size:13px;text-transform:uppercase;color:#64748b">Action</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <a href="${siteUrl}/dashboard/products"
           style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:500">
          Manage Products
        </a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="color:#94a3b8;font-size:12px;margin:0">Amazone Seller Notifications</p>
      </div>
    </div>`;
}

// ─── Product Recommendations ──────────────────────────────────────────────────

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: (string | null)[] | null;
  avgRating: number;
  reviewCount: number;
}

// ─── Product Variants ─────────────────────────────────────────────────────────

export interface VariantOptionValue {
  id: string;
  value: string;
  position: number;
}

export interface VariantOption {
  id: string;
  name: string;
  position: number;
  values: VariantOptionValue[];
}

export interface VariantCombination {
  optionId: string;
  valueId: string;
}

export interface ProductVariantInfo {
  id: string;
  sku: string | null;
  priceInCents: number | null;
  stock: number;
  isActive: boolean;
  combinations: VariantCombination[];
}

export interface ProductVariantsData {
  options: VariantOption[];
  variants: ProductVariantInfo[];
}

export interface CreateProductVariantInput {
  combinations: { optionId: string; valueId: string }[];
  sku?: string;
  priceInCents?: number;
  stock?: number;
}

export interface CreateVariantOptionInput {
  name: string;
  position?: number;
  values: { value: string; position?: number }[];
}
