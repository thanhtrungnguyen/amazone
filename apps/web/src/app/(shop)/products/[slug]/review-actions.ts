"use server";

import { auth } from "@/lib/auth";
import type { CreateReviewInput } from "@amazone/reviews";

type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReview(
  input: CreateReviewInput
): Promise<ReviewActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to write a review." };
  }

  try {
    const { createReview } = await import("@amazone/reviews");
    await createReview(session.user.id, input);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review.";
    return { success: false, error: message };
  }
}
