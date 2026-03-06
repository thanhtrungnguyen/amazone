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

export const metadata = {
  title: "Orders - Admin | Amazone",
  description: "View and manage all orders across the platform.",
};

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

interface AdminOrder {
  id: string;
  customer: string;
  itemCount: number;
  totalCents: number;
  status: OrderStatus;
  date: string;
}

const placeholderOrders: AdminOrder[] = [
  {
    id: "ORD-9281",
    customer: "Alice Johnson",
    itemCount: 2,
    totalCents: 12999,
    status: "delivered",
    date: "2026-03-03",
  },
  {
    id: "ORD-9280",
    customer: "Bob Smith",
    itemCount: 5,
    totalCents: 54900,
    status: "shipped",
    date: "2026-03-03",
  },
  {
    id: "ORD-9279",
    customer: "Charlie Nguyen",
    itemCount: 1,
    totalCents: 8499,
    status: "processing",
    date: "2026-03-02",
  },
  {
    id: "ORD-9278",
    customer: "Diana Lee",
    itemCount: 3,
    totalCents: 199900,
    status: "confirmed",
    date: "2026-03-02",
  },
  {
    id: "ORD-9277",
    customer: "Ethan Park",
    itemCount: 1,
    totalCents: 3299,
    status: "pending",
    date: "2026-03-01",
  },
  {
    id: "ORD-9276",
    customer: "Fiona Martinez",
    itemCount: 4,
    totalCents: 74500,
    status: "delivered",
    date: "2026-02-28",
  },
  {
    id: "ORD-9275",
    customer: "George Kim",
    itemCount: 2,
    totalCents: 15999,
    status: "cancelled",
    date: "2026-02-27",
  },
  {
    id: "ORD-9274",
    customer: "Hannah Brown",
    itemCount: 3,
    totalCents: 42900,
    status: "refunded",
    date: "2026-02-26",
  },
  {
    id: "ORD-9273",
    customer: "Ivan Petrov",
    itemCount: 1,
    totalCents: 29999,
    status: "delivered",
    date: "2026-02-25",
  },
  {
    id: "ORD-9272",
    customer: "Julia Chen",
    itemCount: 2,
    totalCents: 8999,
    status: "shipped",
    date: "2026-02-24",
  },
];

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
    return placeholderOrders;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminOrdersPage(): Promise<React.ReactElement> {
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
