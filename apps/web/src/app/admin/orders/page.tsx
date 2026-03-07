import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import type { OrderStatus } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Orders - Admin | Amazone",
  description: "View and manage all orders across the platform.",
};

interface AdminOrder {
  id: string;
  customer: string;
  itemCount: number;
  totalCents: number;
  status: OrderStatus;
  date: string;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getOrders(): Promise<AdminOrder[]> {
  try {
    const { db, orders, users, orderItems } = await import("@amazone/db");
    const { sql, desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: orders.id,
        customer: users.name,
        itemCount: sql<number>`count(${orderItems.id})::int`,
        totalCents: orders.totalInCents,
        status: orders.status,
        date: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .groupBy(orders.id, users.name)
      .orderBy(desc(orders.createdAt));

    return rows.map((row) => ({
      id: row.id.slice(0, 8).toUpperCase(),
      customer: row.customer,
      itemCount: row.itemCount,
      totalCents: row.totalCents,
      status: row.status as OrderStatus,
      date: row.date.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminOrdersPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const orders = await getOrders();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage all orders across the platform.
        </p>
      </div>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {orders.length} orders total. Showing most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="text-right">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(order.totalCents)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
