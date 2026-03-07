import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge, EmptyState } from "@amazone/shared-ui";
import type { OrderStatus } from "@amazone/shared-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserOrders } from "../actions";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Order History - Amazone",
  description: "View your complete order history on Amazone.",
};

// ── Helpers ──────────────────────────────────────────────────────────

function generateOrderNumber(id: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const shortId = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `AMZ-${year}-${shortId}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Page component ──────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function OrderHistoryPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { cursor } = await searchParams;
  const pageSize = 10;
  const { orders, nextCursor } = await getUserOrders(
    session.user.id,
    cursor,
    pageSize,
  );

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/profile" },
          { label: "Order History" },
        ]}
      />
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and track all your orders
        </p>
      </div>

      {/* Orders list */}
      {orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/profile/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-medium">
                        {generateOrderNumber(order.id, order.createdAt)}
                      </span>
                      <OrderStatusBadge
                        status={order.status as OrderStatus}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Placed on {formatDate(order.createdAt)} &middot;{" "}
                      {order.itemCount} item
                      {order.itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold">
                      {formatPrice(order.totalInCents)}
                    </p>
                    <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            {cursor ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile/orders">First Page</Link>
              </Button>
            ) : (
              <div />
            )}
            {nextCursor ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/orders?cursor=${nextCursor}`}>
                  Next Page
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : cursor ? (
        // On a paginated page with no results — offer to go back
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No more orders to show.
          </p>
          <Button variant="outline" asChild>
            <Link href="/profile/orders">Back to First Page</Link>
          </Button>
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          description="When you place an order, it will appear here."
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
