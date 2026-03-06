import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge, EmptyState } from "@amazone/shared-ui";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, ChevronRight } from "lucide-react";
import type { OrderStatus } from "@amazone/shared-utils";

export const metadata: Metadata = {
  title: "Order History — Amazone",
  description: "View your complete order history on Amazone.",
};

// ── Placeholder data ────────────────────────────────────────────────

interface PlaceholderOrderItem {
  name: string;
  quantity: number;
  priceInCents: number;
}

interface PlaceholderOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalInCents: number;
  itemsCount: number;
  createdAt: string;
  items: PlaceholderOrderItem[];
}

const placeholderOrders: PlaceholderOrder[] = [
  {
    id: "ord_1",
    orderNumber: "AMZ-2025-0042",
    status: "delivered",
    totalInCents: 12998,
    itemsCount: 2,
    createdAt: "2025-02-28",
    items: [
      { name: "Premium Wireless Headphones", quantity: 1, priceInCents: 9999 },
      { name: "Stainless Steel Water Bottle", quantity: 1, priceInCents: 2999 },
    ],
  },
  {
    id: "ord_2",
    orderNumber: "AMZ-2025-0039",
    status: "shipped",
    totalInCents: 49999,
    itemsCount: 1,
    createdAt: "2025-02-20",
    items: [
      { name: 'Ultra HD Smart TV 55"', quantity: 1, priceInCents: 49999 },
    ],
  },
  {
    id: "ord_3",
    orderNumber: "AMZ-2025-0035",
    status: "processing",
    totalInCents: 7999,
    itemsCount: 3,
    createdAt: "2025-02-12",
    items: [
      { name: "Organic Cotton T-Shirt", quantity: 2, priceInCents: 2499 },
      { name: "Bluetooth Portable Speaker", quantity: 1, priceInCents: 3999 },
    ],
  },
  {
    id: "ord_4",
    orderNumber: "AMZ-2025-0028",
    status: "delivered",
    totalInCents: 21998,
    itemsCount: 2,
    createdAt: "2025-01-30",
    items: [
      { name: "Mechanical Gaming Keyboard", quantity: 1, priceInCents: 7999 },
      { name: "Running Shoes Pro", quantity: 1, priceInCents: 12999 },
    ],
  },
  {
    id: "ord_5",
    orderNumber: "AMZ-2025-0015",
    status: "cancelled",
    totalInCents: 8999,
    itemsCount: 1,
    createdAt: "2025-01-10",
    items: [
      { name: "Non-Stick Cookware Set", quantity: 1, priceInCents: 8999 },
    ],
  },
  {
    id: "ord_6",
    orderNumber: "AMZ-2024-0198",
    status: "refunded",
    totalInCents: 3999,
    itemsCount: 1,
    createdAt: "2024-12-18",
    items: [
      { name: "Bluetooth Portable Speaker", quantity: 1, priceInCents: 3999 },
    ],
  },
];

// ── Data fetching with fallback ─────────────────────────────────────

async function getOrders(): Promise<PlaceholderOrder[]> {
  try {
    // TODO: Replace with real data fetching from @amazone/orders
    const { auth } = await import("@/lib/auth");
    await auth();
    // When real DB is connected, fetch orders here
    return placeholderOrders;
  } catch {
    return placeholderOrders;
  }
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

export default async function OrderHistoryPage() {
  const orders = await getOrders();

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
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Orders list */}
      {orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4">
                {/* Order header row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-medium">
                        {order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Placed on {formatDate(order.createdAt)} &middot;{" "}
                      {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(order.totalInCents)}
                  </p>
                </div>

                {/* Order items preview */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <ul className="flex flex-col gap-2" aria-label="Order items">
                    {order.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="ml-1 text-xs">
                              x{item.quantity}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-medium">
                          {formatPrice(item.priceInCents * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order action link */}
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                    <Link href={`/profile/orders/${order.id}`}>
                      View Order Details
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
