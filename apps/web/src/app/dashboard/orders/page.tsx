import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { EmptyState, OrderStatusBadge } from "@amazone/shared-ui";

export const metadata = {
  title: "Orders — Amazone Dashboard",
};

interface DashboardOrder {
  id: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  totalInCents: number;
  shippingName: string;
  shippingCity: string;
  createdAt: Date;
  itemCount: number;
}

const placeholderOrders: DashboardOrder[] = [
  {
    id: "ord-001",
    status: "delivered",
    totalInCents: 15998,
    shippingName: "John Doe",
    shippingCity: "New York",
    createdAt: new Date("2025-02-28"),
    itemCount: 2,
  },
  {
    id: "ord-002",
    status: "shipped",
    totalInCents: 7999,
    shippingName: "Jane Smith",
    shippingCity: "Los Angeles",
    createdAt: new Date("2025-03-01"),
    itemCount: 1,
  },
  {
    id: "ord-003",
    status: "pending",
    totalInCents: 53998,
    shippingName: "Bob Wilson",
    shippingCity: "Chicago",
    createdAt: new Date("2025-03-02"),
    itemCount: 3,
  },
];

async function getOrders(): Promise<DashboardOrder[]> {
  try {
    const { db, orders } = await import("@amazone/db");
    const { desc } = await import("drizzle-orm");

    const result = await db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 20,
    });

    return result.map((o) => ({
      id: o.id.slice(0, 8),
      status: o.status,
      totalInCents: o.totalInCents,
      shippingName: o.shippingName,
      shippingCity: o.shippingCity,
      createdAt: o.createdAt,
      itemCount: 0,
    }));
  } catch {
    return placeholderOrders;
  }
}

export default async function DashboardOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Track and manage customer orders
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="No orders yet"
          description="Orders will appear here when customers make purchases."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingName} — {order.shippingCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(order.totalInCents)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
