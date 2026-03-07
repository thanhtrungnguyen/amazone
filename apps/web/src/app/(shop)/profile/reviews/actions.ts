"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db, reviews } from "@amazone/db";
import { eq, desc } from "drizzle-orm";
import type { UpdateReviewInput } from "@amazone/reviews";

// ── Types ────────────────────────────────────────────────────────────

export interface UserReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
}

type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ── Queries ──────────────────────────────────────────────────────────

export async function getUserReviews(): Promise<UserReview[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const userReviews = await db.query.reviews.findMany({
    where: eq(reviews.userId, session.user.id),
    orderBy: desc(reviews.createdAt),
    with: {
      product: {
        columns: {
          id: true,
          name: true,
          slug: true,
          images: true,
        },
      },
    },
  });

  return userReviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    product: {
      id: review.product.id,
      name: review.product.name,
      slug: review.product.slug,
      image: review.product.images?.[0] ?? null,
    },
  }));
}

// ── Mutations ────────────────────────────────────────────────────────

export async function editUserReview(
  reviewId: string,
  input: UpdateReviewInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to edit a review." };
  }

  try {
    const { updateReview } = await import("@amazone/reviews");
    const updated = await updateReview(session.user.id, reviewId, input);

    if (!updated) {
      return { success: false, error: "Review not found or you do not have permission to edit it." };
    }

    revalidatePath("/profile/reviews");
    revalidatePath("/products", "layout");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update review.";
    return { success: false, error: message };
  }
}

export async function deleteUserReview(
  reviewId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to delete a review." };
  }

  try {
    const { deleteReview } = await import("@amazone/reviews");
    const deleted = await deleteReview(session.user.id, reviewId);

    if (!deleted) {
      return { success: false, error: "Review not found or you do not have permission to delete it." };
    }

    revalidatePath("/profile/reviews");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete review.";
    return { success: false, error: message };
  }
}
