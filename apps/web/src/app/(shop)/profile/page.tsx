import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import type { OrderStatus } from "@amazone/shared-utils";
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
  Shield,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserProfile, getUserStats, getUserOrders } from "./actions";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "My Profile - Amazone",
  description:
    "View your account details, order history, and activity on Amazone.",
};

// ── Helpers ────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateOrderNumber(id: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const hex = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `AMZ-${year}-${hex}`;
}

function getRoleBadge(role: string): { label: string; className: string } {
  switch (role) {
    case "admin":
      return { label: "Admin", className: "bg-red-100 text-red-800" };
    case "seller":
      return { label: "Seller", className: "bg-purple-100 text-purple-800" };
    default:
      return { label: "Customer", className: "bg-blue-100 text-blue-800" };
  }
}

// ── Page component ─────────────────────────────────────────────────

export default async function ProfilePage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [profile, stats, recentOrdersData] = await Promise.all([
    getUserProfile(userId),
    getUserStats(userId),
    getUserOrders(userId, undefined, 3),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  const roleBadge = getRoleBadge(profile.role);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account" },
        ]}
      />
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile/settings" className="flex items-center gap-2">
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
            aria-label={`Avatar for ${profile.name}`}
          >
            {getInitials(profile.name)}
          </div>

          {/* Name, email, role, member since */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.className}`}
              >
                <Shield className="h-3 w-3" />
                {roleBadge.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Member since {formatDate(profile.createdAt)}</span>
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
              <p className="text-2xl font-bold">{stats.orderCount}</p>
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
              <p className="text-2xl font-bold">{stats.reviewCount}</p>
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

        {recentOrdersData.orders.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentOrdersData.orders.map((order) => (
              <Link key={order.id} href={`/profile/orders/${order.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          {generateOrderNumber(order.id, order.createdAt)}
                        </span>
                        <OrderStatusBadge
                          status={order.status as OrderStatus}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)} &middot;{" "}
                        {order.itemCount} item
                        {order.itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatPrice(order.totalInCents)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 px-4 py-3"
          asChild
        >
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
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 px-4 py-3"
          asChild
        >
          <Link href="/profile/reviews">
            <Star className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">My Reviews</p>
              <p className="text-xs text-muted-foreground">
                Manage your product reviews
              </p>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 px-4 py-3"
          asChild
        >
          <Link href="/profile/settings">
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
