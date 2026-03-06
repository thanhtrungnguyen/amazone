"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, type CreateReviewInput } from "@amazone/reviews";
import { RATING_MAX } from "@amazone/shared-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Star, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { submitReview } from "./review-actions";

interface ReviewFormProps {
  productId: string;
}

function StarRatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}): React.ReactElement {
  const [hoveredStar, setHoveredStar] = useState(0);

  const displayRating = hoveredStar || value;

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
      >
        {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""} - ${ratingLabels[star]}`}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {ratingLabels[displayRating]}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReviewForm({
  productId,
}: ReviewFormProps): React.ReactElement {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      productId,
      rating: 0,
      title: "",
      comment: "",
    },
  });

  const currentRating = watch("rating");

  function onSubmit(data: CreateReviewInput): void {
    startTransition(async () => {
      const result = await submitReview(data);

      if (result.success) {
        toast.success("Review submitted successfully!");
        reset();
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  // Loading state for session
  if (status === "loading") {
    return <div className="h-10" />;
  }

  // Not signed in
  if (!session?.user) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>{" "}
          to write a review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full justify-between sm:w-auto"
        aria-expanded={isOpen}
        aria-controls="review-form"
      >
        Write a Review
        {isOpen ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <Card id="review-form">
          <CardHeader>
            <CardTitle className="text-lg">Write Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Star Rating */}
              <div className="space-y-2">
                <Label htmlFor="rating">
                  Rating <span className="text-destructive">*</span>
                </Label>
                <StarRatingPicker
                  value={currentRating}
                  onChange={(rating) =>
                    setValue("rating", rating, { shouldValidate: true })
                  }
                />
                {errors.rating && (
                  <p className="text-sm text-destructive">
                    {errors.rating.message ?? "Please select a rating"}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="review-title">Title (optional)</Label>
                <Input
                  id="review-title"
                  placeholder="Summarize your experience"
                  maxLength={255}
                  {...register("title")}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="review-comment">Comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  placeholder="Share your thoughts about this product..."
                  maxLength={5000}
                  rows={4}
                  {...register("comment")}
                  aria-invalid={!!errors.comment}
                />
                {errors.comment && (
                  <p className="text-sm text-destructive">
                    {errors.comment.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Review
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset();
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
