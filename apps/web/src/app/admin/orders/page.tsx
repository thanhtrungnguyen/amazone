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
  totalCents: number;
  status: OrderStatus;
  date: string;
}

const orders: AdminOrder[] = [
  {
    id: "ORD-9281",
    customer: "Alice Johnson",
    totalCents: 12999,
    status: "delivered",
    date: "2026-03-03",
  },
  {
    id: "ORD-9280",
    customer: "Bob Smith",
    totalCents: 54900,
    status: "shipped",
    date: "2026-03-03",
  },
  {
    id: "ORD-9279",
    customer: "Charlie Nguyen",
    totalCents: 8499,
    status: "processing",
    date: "2026-03-02",
  },
  {
    id: "ORD-9278",
    customer: "Diana Lee",
    totalCents: 199900,
    status: "confirmed",
    date: "2026-03-02",
  },
  {
    id: "ORD-9277",
    customer: "Ethan Park",
    totalCents: 3299,
    status: "pending",
    date: "2026-03-01",
  },
  {
    id: "ORD-9276",
    customer: "Fiona Martinez",
    totalCents: 74500,
    status: "delivered",
    date: "2026-02-28",
  },
  {
    id: "ORD-9275",
    customer: "George Kim",
    totalCents: 15999,
    status: "cancelled",
    date: "2026-02-27",
  },
  {
    id: "ORD-9274",
    customer: "Hannah Brown",
    totalCents: 42900,
    status: "refunded",
    date: "2026-02-26",
  },
  {
    id: "ORD-9273",
    customer: "Ivan Petrov",
    totalCents: 29999,
    status: "delivered",
    date: "2026-02-25",
  },
  {
    id: "ORD-9272",
    customer: "Julia Chen",
    totalCents: 8999,
    status: "shipped",
    date: "2026-02-24",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminOrdersPage(): React.ReactElement {
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
