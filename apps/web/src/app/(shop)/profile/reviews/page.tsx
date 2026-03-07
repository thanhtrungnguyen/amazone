import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { RatingStars } from "@amazone/shared-ui";
import { EmptyState } from "@amazone/shared-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, BadgeCheck } from "lucide-react";
import { getUserReviews } from "./actions";
import { EditReviewDialog } from "./edit-review-dialog";
import { DeleteReviewButton } from "./delete-review-button";

export const metadata: Metadata = {
  title: "My Reviews — Amazone",
  description: "Manage your product reviews on Amazone.",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function UserReviewsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const reviews = await getUserReviews();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} written
          </p>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row">
                {/* Product image */}
                <Link
                  href={`/products/${review.product.slug}`}
                  className="shrink-0"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-50">
                    {review.product.image ? (
                      <Image
                        src={review.product.image}
                        alt={review.product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Star className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Review content */}
                <div className="flex flex-1 flex-col gap-2">
                  {/* Product name and badges */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {review.product.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={review.rating} size="sm" />
                        {review.isVerifiedPurchase && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-xs font-normal"
                          >
                            <BadgeCheck className="h-3 w-3" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review title */}
                  {review.title && (
                    <p className="font-medium">{review.title}</p>
                  )}

                  {/* Review comment */}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {review.comment}
                    </p>
                  )}

                  {/* Date and actions */}
                  <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {formatDate(review.createdAt)}
                      {review.updatedAt > review.createdAt && (
                        <span> (edited {formatDate(review.updatedAt)})</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <EditReviewDialog
                        reviewId={review.id}
                        initialRating={review.rating}
                        initialTitle={review.title ?? ""}
                        initialComment={review.comment ?? ""}
                      />
                      <DeleteReviewButton
                        reviewId={review.id}
                        productName={review.product.name}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No reviews yet"
          description="When you review a product, it will appear here."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
