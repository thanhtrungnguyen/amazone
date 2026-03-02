import { z } from "zod";
import { RATING_MIN, RATING_MAX } from "@amazone/shared-utils";

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  title: z.string().max(255).optional(),
  comment: z.string().max(5000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX).optional(),
  title: z.string().max(255).optional(),
  comment: z.string().max(5000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
