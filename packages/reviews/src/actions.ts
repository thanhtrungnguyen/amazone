"use server";

import { db, reviews, products, orderItems, orders } from "@amazone/db";
import { eq, and, desc, avg, count } from "drizzle-orm";
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from "./types";

export async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<typeof reviews.$inferSelect> {
  const validated = createReviewSchema.parse(input);

  // Check for existing review from this user on this product
  const existingReview = await db.query.reviews.findFirst({
    where: and(
      eq(reviews.userId, userId),
      eq(reviews.productId, validated.productId),
    ),
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product. You can edit your existing review instead.");
  }

  // Check if user has purchased and received this product
  const purchasedOrders = await db
    .select({ status: orders.status })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, validated.productId),
        eq(orders.status, "delivered"),
      )
    )
    .limit(1);

  const isVerifiedPurchase = purchasedOrders.length > 0;

  const [review] = await db
    .insert(reviews)
    .values({
      userId,
      ...validated,
      isVerifiedPurchase,
    })
    .returning();

  // Update product's average rating
  await updateProductRating(validated.productId);

  return review;
}

export async function updateReview(
  userId: string,
  reviewId: string,
  input: UpdateReviewInput
): Promise<typeof reviews.$inferSelect | undefined> {
  const validated = updateReviewSchema.parse(input);

  const [review] = await db
    .update(reviews)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .returning();

  if (review) {
    await updateProductRating(review.productId);
  }

  return review;
}

export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<boolean> {
  const review = await db.query.reviews.findFirst({
    where: and(eq(reviews.id, reviewId), eq(reviews.userId, userId)),
  });

  if (!review) return false;

  await db
    .delete(reviews)
    .where(eq(reviews.id, reviewId));

  await updateProductRating(review.productId);

  return true;
}

export async function getProductReviews(
  productId: string,
  limit = 20,
  cursor?: string
): Promise<(typeof reviews.$inferSelect)[]> {
  return db.query.reviews.findMany({
    where: eq(reviews.productId, productId),
    orderBy: desc(reviews.createdAt),
    limit,
    with: {
      user: { columns: { id: true, name: true, image: true } },
    },
  });
}

async function updateProductRating(productId: string): Promise<void> {
  const result = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const stats = result[0];
  if (stats) {
    await db
      .update(products)
      .set({
        avgRating: Math.round((Number(stats.avgRating) || 0) * 100),
        reviewCount: Number(stats.reviewCount),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }
}
