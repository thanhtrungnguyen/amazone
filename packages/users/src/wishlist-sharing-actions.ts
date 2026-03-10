"use server";

import { db, wishlists, products, users } from "@amazone/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

const wishlistIdSchema = z.string().uuid();
const shareTokenSchema = z.string().min(1).max(64);

/**
 * Generate a cryptographically secure random share token.
 */
function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Toggle the public/private visibility of a user's wishlist.
 * When making public, generates a share token.
 * When making private, clears the share token.
 *
 * Note: The wishlists table uses a flat model where each row is a
 * user+product pair. "isPublic" and "shareToken" are per-row but
 * conceptually represent the whole wishlist for that user. We toggle
 * all rows for the given user at once.
 */
export async function toggleWishlistPublic(
  wishlistId: string,
  userId: string
): Promise<
  | { success: true; data: { isPublic: boolean; shareToken: string | null } }
  | { success: false; error: string }
> {
  const idParse = wishlistIdSchema.safeParse(wishlistId);
  if (!idParse.success) {
    return { success: false, error: "errors.wishlist.invalid_id" };
  }

  const userIdParse = z.string().uuid().safeParse(userId);
  if (!userIdParse.success) {
    return { success: false, error: "errors.wishlist.invalid_user" };
  }

  try {
    // Find the wishlist item to check ownership and current state
    const wishlistItem = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.id, wishlistId),
        eq(wishlists.userId, userId)
      ),
    });

    if (!wishlistItem) {
      return { success: false, error: "errors.wishlist.not_found" };
    }

    const newIsPublic = !wishlistItem.isPublic;
    const newShareToken = newIsPublic ? generateShareToken() : null;

    // Update all wishlist items for this user to match the new visibility
    await db
      .update(wishlists)
      .set({
        isPublic: newIsPublic,
        shareToken: newShareToken,
      })
      .where(eq(wishlists.userId, userId));

    return {
      success: true,
      data: { isPublic: newIsPublic, shareToken: newShareToken },
    };
  } catch (error) {
    console.error("toggleWishlistPublic: DB error", {
      wishlistId,
      userId,
      error,
    });
    return { success: false, error: "errors.wishlist.toggle_failed" };
  }
}

export interface PublicWishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  productCompareAtPrice: number | null;
  productImages: string[] | null;
  productAvgRating: number;
  productReviewCount: number;
  productStock: number;
}

export interface PublicWishlist {
  ownerName: string;
  itemCount: number;
  items: PublicWishlistItem[];
}

/**
 * Fetch a public wishlist by its share token. No auth required.
 * Returns the wishlist items with product details.
 */
export async function getPublicWishlist(
  shareToken: string
): Promise<
  | { success: true; data: PublicWishlist }
  | { success: false; error: string }
> {
  const tokenParse = shareTokenSchema.safeParse(shareToken);
  if (!tokenParse.success) {
    return { success: false, error: "errors.wishlist.invalid_token" };
  }

  try {
    // Find all wishlist items with this share token that are public
    const rows = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        userId: wishlists.userId,
        productName: products.name,
        productSlug: products.slug,
        productPrice: products.price,
        productCompareAtPrice: products.compareAtPrice,
        productImages: products.images,
        productAvgRating: products.avgRating,
        productReviewCount: products.reviewCount,
        productStock: products.stock,
        productIsActive: products.isActive,
        ownerName: users.name,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .innerJoin(users, eq(wishlists.userId, users.id))
      .where(
        and(
          eq(wishlists.shareToken, shareToken),
          eq(wishlists.isPublic, true),
          eq(products.isActive, true)
        )
      );

    if (rows.length === 0) {
      return { success: false, error: "errors.wishlist.not_found" };
    }

    const ownerName = rows[0].ownerName;

    return {
      success: true,
      data: {
        ownerName,
        itemCount: rows.length,
        items: rows.map((row) => ({
          id: row.id,
          productId: row.productId,
          productName: row.productName,
          productSlug: row.productSlug,
          productPrice: row.productPrice,
          productCompareAtPrice: row.productCompareAtPrice,
          productImages: row.productImages as string[] | null,
          productAvgRating: row.productAvgRating,
          productReviewCount: row.productReviewCount,
          productStock: row.productStock,
        })),
      },
    };
  } catch (error) {
    console.error("getPublicWishlist: DB error", { shareToken, error });
    return { success: false, error: "errors.wishlist.fetch_failed" };
  }
}

/**
 * Get the share URL for a user's wishlist.
 * Returns null if the wishlist is not public.
 */
export async function getShareLink(
  wishlistId: string,
  userId: string
): Promise<
  | { success: true; data: { shareUrl: string | null; isPublic: boolean } }
  | { success: false; error: string }
> {
  const idParse = wishlistIdSchema.safeParse(wishlistId);
  if (!idParse.success) {
    return { success: false, error: "errors.wishlist.invalid_id" };
  }

  const userIdParse = z.string().uuid().safeParse(userId);
  if (!userIdParse.success) {
    return { success: false, error: "errors.wishlist.invalid_user" };
  }

  try {
    const wishlistItem = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.id, wishlistId),
        eq(wishlists.userId, userId)
      ),
    });

    if (!wishlistItem) {
      return { success: false, error: "errors.wishlist.not_found" };
    }

    if (!wishlistItem.isPublic || !wishlistItem.shareToken) {
      return {
        success: true,
        data: { shareUrl: null, isPublic: false },
      };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const shareUrl = `${siteUrl}/wishlists/shared/${wishlistItem.shareToken}`;

    return {
      success: true,
      data: { shareUrl, isPublic: true },
    };
  } catch (error) {
    console.error("getShareLink: DB error", { wishlistId, userId, error });
    return { success: false, error: "errors.wishlist.share_link_failed" };
  }
}
