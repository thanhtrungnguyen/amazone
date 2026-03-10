import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@amazone/shared-utils";
import { db, orders, users, reviews, products, returnRequests } from "@amazone/db";
import { desc, eq } from "drizzle-orm";
import {
  ShoppingCart,
  UserPlus,
  Star,
  RotateCcw,
} from "lucide-react";

type ActivityType = "new_order" | "new_user" | "new_review" | "return_filed";

interface ActivityItem {
  type: ActivityType;
  message: string;
  detail: string | null;
  createdAt: Date;
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const [recentOrders, recentUsers, recentReviews, recentReturns] =
    await Promise.all([
      db
        .select({
          userName: users.name,
          totalInCents: orders.totalInCents,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(10),
      db
        .select({
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10),
      db
        .select({
          userName: users.name,
          productName: products.name,
          rating: reviews.rating,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .innerJoin(products, eq(reviews.productId, products.id))
        .orderBy(desc(reviews.createdAt))
        .limit(10),
      db
        .select({
          userName: users.name,
          reason: returnRequests.reason,
          createdAt: returnRequests.createdAt,
        })
        .from(returnRequests)
        .innerJoin(users, eq(returnRequests.userId, users.id))
        .orderBy(desc(returnRequests.createdAt))
        .limit(10),
    ]);

  const activities: ActivityItem[] = [];

  for (const order of recentOrders) {
    activities.push({
      type: "new_order",
      message: `${order.userName} placed an order`,
      detail: formatPrice(order.totalInCents),
      createdAt: order.createdAt,
    });
  }

  for (const user of recentUsers) {
    activities.push({
      type: "new_user",
      message: `${user.name} signed up`,
      detail: user.email,
      createdAt: user.createdAt,
    });
  }

  for (const review of recentReviews) {
    const stars = "\u2605".repeat(review.rating) + "\u2606".repeat(5 - review.rating);
    activities.push({
      type: "new_review",
      message: `${review.userName} reviewed "${review.productName.length > 40 ? review.productName.slice(0, 40) + "..." : review.productName}"`,
      detail: stars,
      createdAt: review.createdAt,
    });
  }

  for (const ret of recentReturns) {
    activities.push({
      type: "return_filed",
      message: `${ret.userName} filed a return`,
      detail: ret.reason.length > 50 ? ret.reason.slice(0, 50) + "..." : ret.reason,
      createdAt: ret.createdAt,
    });
  }

  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, 10);
}

const ACTIVITY_ICONS: Record<ActivityType, typeof ShoppingCart> = {
  new_order: ShoppingCart,
  new_user: UserPlus,
  new_review: Star,
  return_filed: RotateCcw,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  new_order: "bg-blue-100 text-blue-600",
  new_user: "bg-green-100 text-green-600",
  new_review: "bg-yellow-100 text-yellow-600",
  return_filed: "bg-red-100 text-red-600",
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toISOString().slice(0, 10);
}

export async function RecentActivityFeed(): Promise<React.ReactElement> {
  let activities: ActivityItem[];
  let error = false;

  try {
    activities = await getRecentActivity();
  } catch {
    activities = [];
    error = true;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest platform events across orders, users, reviews, and returns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Failed to load recent activity.</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.type];
              const colorClass = ACTIVITY_COLORS[activity.type];

              return (
                <div
                  key={`${activity.type}-${activity.createdAt.getTime()}-${index}`}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {activity.message}
                    </p>
                    {activity.detail && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {activity.detail}
                      </p>
                    )}
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={activity.createdAt.toISOString()}
                  >
                    {formatRelativeTime(activity.createdAt)}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
