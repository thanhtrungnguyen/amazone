import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { EmptyState, OrderStatusBadge } from "@amazone/shared-ui";
import { auth } from "@/lib/auth";
import { OrderStatusSelect } from "./order-status-select";

export const metadata = {
  title: "Orders — Amazone Dashboard",
};

interface DashboardOrder {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  totalInCents: number;
  shippingName: string;
  shippingCity: string;
  createdAt: Date;
  itemCount: number;
}

async function getSellerOrders(
  userId: string,
  isAdmin: boolean
): Promise<DashboardOrder[]> {
  try {
    const { db, orders, orderItems, products } = await import("@amazone/db");
    const { desc, eq, count } = await import("drizzle-orm");

    if (isAdmin) {
      // Admins see all orders with item counts
      const result = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalInCents: orders.totalInCents,
          shippingName: orders.shippingName,
          shippingCity: orders.shippingCity,
          createdAt: orders.createdAt,
          itemCount: count(orderItems.id),
        })
        .from(orders)
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .groupBy(orders.id)
        .orderBy(desc(orders.createdAt))
        .limit(50);

      return result.map((o) => ({
        id: o.id,
        status: o.status,
        totalInCents: o.totalInCents,
        shippingName: o.shippingName,
        shippingCity: o.shippingCity,
        createdAt: o.createdAt,
        itemCount: Number(o.itemCount),
      }));
    }

    // Sellers see only orders containing their products
    const result = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalInCents: orders.totalInCents,
        shippingName: orders.shippingName,
        shippingCity: orders.shippingCity,
        createdAt: orders.createdAt,
        itemCount: count(orderItems.id),
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.sellerId, userId))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))
      .limit(50);

    return result.map((o) => ({
      id: o.id,
      status: o.status,
      totalInCents: o.totalInCents,
      shippingName: o.shippingName,
      shippingCity: o.shippingCity,
      createdAt: o.createdAt,
      itemCount: Number(o.itemCount),
    }));
  } catch {
    return [];
  }
}

export default async function DashboardOrdersPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !["seller", "admin"].includes(session.user.role ?? "")
  ) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "admin";
  const orders = await getSellerOrders(session.user.id, isAdmin);

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
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="min-w-0 flex-1 transition-colors hover:text-primary"
                  >
                    <p className="font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingName} — {order.shippingCity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                    </p>
                  </Link>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(order.totalInCents)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
