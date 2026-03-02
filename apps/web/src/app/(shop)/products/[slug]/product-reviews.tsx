import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@amazone/shared-ui";
import { RATING_MAX } from "@amazone/shared-utils";
import { CheckCircle, User } from "lucide-react";

interface ReviewUser {
  id: string;
  name: string;
  image: string | null;
}

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: ReviewUser;
}

interface ProductReviewsProps {
  productId: string;
}

const placeholderReviews: Review[] = [
  {
    id: "placeholder-1",
    userId: "user-1",
    productId: "",
    rating: 5,
    title: "Absolutely love it!",
    comment:
      "This product exceeded all my expectations. The quality is outstanding and it arrived earlier than expected. Would definitely purchase again.",
    isVerifiedPurchase: true,
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-02-15"),
    user: { id: "user-1", name: "Sarah M.", image: null },
  },
  {
    id: "placeholder-2",
    userId: "user-2",
    productId: "",
    rating: 4,
    title: "Great value for the price",
    comment:
      "Very solid product overall. Build quality is impressive and it works exactly as described. Only giving 4 stars because the packaging could be better.",
    isVerifiedPurchase: true,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-02-10"),
    user: { id: "user-2", name: "James R.", image: null },
  },
  {
    id: "placeholder-3",
    userId: "user-3",
    productId: "",
    rating: 5,
    title: "Perfect for everyday use",
    comment:
      "I have been using this daily for two weeks now and it has held up beautifully. Highly recommend to anyone on the fence about purchasing.",
    isVerifiedPurchase: false,
    createdAt: new Date("2026-01-28"),
    updatedAt: new Date("2026-01-28"),
    user: { id: "user-3", name: "Emily T.", image: null },
  },
  {
    id: "placeholder-4",
    userId: "user-4",
    productId: "",
    rating: 3,
    title: "Decent but has some quirks",
    comment:
      "The product itself is fine and does what it is supposed to. However, the instructions were confusing and setup took longer than expected.",
    isVerifiedPurchase: true,
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
    user: { id: "user-4", name: "Michael K.", image: null },
  },
  {
    id: "placeholder-5",
    userId: "user-5",
    productId: "",
    rating: 5,
    title: "Best purchase this year",
    comment:
      "Cannot say enough good things about this product. The attention to detail is remarkable and customer support was incredibly helpful when I had a question.",
    isVerifiedPurchase: true,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    user: { id: "user-5", name: "Priya S.", image: null },
  },
];

async function fetchReviews(productId: string): Promise<Review[]> {
  try {
    const { getProductReviews } = await import("@amazone/reviews");
    const reviews = await getProductReviews(productId);
    return reviews as Review[];
  } catch {
    return placeholderReviews.map((r) => ({ ...r, productId }));
  }
}

function computeRatingSummary(reviews: Review[]): {
  average: number;
  total: number;
  distribution: Record<number, number>;
} {
  const total = reviews.length;
  const distribution: Record<number, number> = {};
  for (let i = RATING_MAX; i >= 1; i--) {
    distribution[i] = 0;
  }

  let sum = 0;
  for (const review of reviews) {
    sum += review.rating;
    distribution[review.rating] = (distribution[review.rating] || 0) + 1;
  }

  const average = total > 0 ? sum / total : 0;

  return { average, total, distribution };
}

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function ProductReviews({
  productId,
}: ProductReviewsProps): Promise<React.ReactElement> {
  const reviews = await fetchReviews(productId);
  const { average, total, distribution } = computeRatingSummary(reviews);

  if (total === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to review this product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
        {/* Average rating */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold">{average.toFixed(1)}</span>
          <RatingStars rating={average} size="lg" />
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Rating distribution bars */}
        <div className="flex-1 space-y-2">
          {Array.from({ length: RATING_MAX }, (_, i) => RATING_MAX - i).map(
            (star) => {
              const count = distribution[star] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-12 text-right text-sm text-muted-foreground">
                    {star} star
                  </span>
                  <div
                    className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${star} star reviews: ${count} out of ${total}`}
                  >
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      <Separator />

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="space-y-3 rounded-lg border p-4"
            aria-label={`Review by ${review.user?.name ?? "Anonymous"}`}
          >
            {/* Reviewer info row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {review.user?.image ? (
                  <img
                    src={review.user.image}
                    alt={review.user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : review.user?.name ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {getInitials(review.user.name)}
                  </span>
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {review.user?.name ?? "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatReviewDate(review.createdAt)}
                </p>
              </div>
              {review.isVerifiedPurchase && (
                <Badge
                  variant="secondary"
                  className="gap-1 text-green-700"
                >
                  <CheckCircle className="h-3 w-3" />
                  Verified Purchase
                </Badge>
              )}
            </div>

            {/* Rating and title */}
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} size="sm" />
              {review.title && (
                <span className="font-semibold">{review.title}</span>
              )}
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.comment}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
