"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateReviewSchema, type UpdateReviewInput } from "@amazone/reviews";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/star-rating-input";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { editUserReview } from "./actions";

interface EditReviewDialogProps {
  reviewId: string;
  initialRating: number;
  initialTitle: string;
  initialComment: string;
}

export function EditReviewDialog({
  reviewId,
  initialRating,
  initialTitle,
  initialComment,
}: EditReviewDialogProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateReviewInput>({
    resolver: zodResolver(updateReviewSchema),
    defaultValues: {
      rating: initialRating,
      title: initialTitle,
      comment: initialComment,
    },
  });

  const currentRating = watch("rating") ?? 0;

  function onSubmit(data: UpdateReviewInput): void {
    startTransition(async () => {
      const result = await editUserReview(reviewId, data);

      if (result.success) {
        toast.success("Review updated successfully.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (nextOpen) {
      // Reset form to initial values when opening
      reset({
        rating: initialRating,
        title: initialTitle,
        comment: initialComment,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
          <DialogDescription>
            Update your rating and comments for this product.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Star Rating */}
          <div className="space-y-2">
            <Label htmlFor="edit-rating">
              Rating <span className="text-destructive">*</span>
            </Label>
            <StarRatingInput
              value={currentRating}
              onChange={(rating) =>
                setValue("rating", rating, { shouldValidate: true })
              }
              disabled={isPending}
            />
            {errors.rating && (
              <p className="text-sm text-destructive">
                {errors.rating.message ?? "Please select a rating"}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-review-title">Title (optional)</Label>
            <Input
              id="edit-review-title"
              placeholder="Summarize your experience"
              maxLength={255}
              disabled={isPending}
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
            <Label htmlFor="edit-review-comment">Comment (optional)</Label>
            <Textarea
              id="edit-review-comment"
              placeholder="Share your thoughts about this product..."
              maxLength={5000}
              rows={4}
              disabled={isPending}
              {...register("comment")}
              aria-invalid={!!errors.comment}
            />
            {errors.comment && (
              <p className="text-sm text-destructive">
                {errors.comment.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
