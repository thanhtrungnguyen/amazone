import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Package,
  Settings,
  Star,
  DollarSign,
  ArrowRight,
  Calendar,
} from "lucide-react";
import type { OrderStatus } from "@amazone/shared-utils";

export const metadata: Metadata = {
  title: "My Profile — Amazone",
  description: "View your account details, order history, and activity on Amazone.",
};

// ── Placeholder data (used when DB is not connected) ────────────────

interface PlaceholderUser {
  name: string;
  email: string;
  memberSince: string;
}

interface PlaceholderOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalInCents: number;
  itemsCount: number;
  createdAt: string;
}

interface PlaceholderStats {
  totalOrders: number;
  totalSpentInCents: number;
  reviewsWritten: number;
}

const placeholderUser: PlaceholderUser = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  memberSince: "2024-03-15",
};

const placeholderStats: PlaceholderStats = {
  totalOrders: 12,
  totalSpentInCents: 234599,
  reviewsWritten: 7,
};

const placeholderRecentOrders: PlaceholderOrder[] = [
  {
    id: "ord_1",
    orderNumber: "AMZ-2025-0042",
    status: "delivered",
    totalInCents: 12998,
    itemsCount: 2,
    createdAt: "2025-02-28",
  },
  {
    id: "ord_2",
    orderNumber: "AMZ-2025-0039",
    status: "shipped",
    totalInCents: 49999,
    itemsCount: 1,
    createdAt: "2025-02-20",
  },
  {
    id: "ord_3",
    orderNumber: "AMZ-2025-0035",
    status: "processing",
    totalInCents: 7999,
    itemsCount: 3,
    createdAt: "2025-02-12",
  },
];

// ── Data fetching with fallback ─────────────────────────────────────

async function getProfileData(): Promise<{
  user: PlaceholderUser;
  stats: PlaceholderStats;
  recentOrders: PlaceholderOrder[];
}> {
  try {
    // TODO: Replace with real data fetching from @amazone/users and @amazone/orders
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (session?.user) {
      return {
        user: {
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          memberSince: "2024-03-15",
        },
        stats: placeholderStats,
        recentOrders: placeholderRecentOrders,
      };
    }
    return {
      user: placeholderUser,
      stats: placeholderStats,
      recentOrders: placeholderRecentOrders,
    };
  } catch {
    return {
      user: placeholderUser,
      stats: placeholderStats,
      recentOrders: placeholderRecentOrders,
    };
  }
}

// ── Helper: extract initials ────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Helper: format date ─────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Page component ──────────────────────────────────────────────────

export default async function ProfilePage() {
  const { user, stats, recentOrders } = await getProfileData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* User identity card */}
      <Card className="mb-6">
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar with initials */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            aria-label={`Avatar for ${user.name}`}
          >
            {getInitials(user.name)}
          </div>

          {/* Name, email, member since */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Member since {formatDate(user.memberSince)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatPrice(stats.totalSpentInCents)}
              </p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.reviewsWritten}</p>
              <p className="text-sm text-muted-foreground">Reviews Written</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Recent orders */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile/orders" className="flex items-center gap-1">
              View All Orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentOrders.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} &middot;{" "}
                      {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(order.totalInCents)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No orders yet.{" "}
                <Link href="/products" className="text-primary underline">
                  Start shopping
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="h-auto justify-start gap-3 px-4 py-3" asChild>
          <Link href="/profile/orders">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Order History</p>
              <p className="text-xs text-muted-foreground">
                View all past and current orders
              </p>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 px-4 py-3" asChild>
          <Link href="/settings">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">Account Settings</p>
              <p className="text-xs text-muted-foreground">
                Update profile, address, and preferences
              </p>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}
