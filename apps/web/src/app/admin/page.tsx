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
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import type { OrderStatus } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - Admin | Amazone",
  description: "Admin dashboard overview with platform-wide metrics.",
};

// ---------------------------------------------------------------------------
// Placeholder data -- fallback when DB is unavailable
// ---------------------------------------------------------------------------

const placeholderStats = {
  totalUsers: 1_284,
  totalProducts: 3_519,
  totalOrders: 8_742,
  totalRevenueCents: 1_294_350_00, // $1,294,350.00
};

interface RecentOrder {
  id: string;
  customer: string;
  totalCents: number;
  status: OrderStatus;
  date: string;
}

const placeholderRecentOrders: RecentOrder[] = [
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
];

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
}

async function getStats(): Promise<DashboardStats> {
  try {
    const { db, users, products, orders } = await import("@amazone/db");
    const { sql, eq, and, ne } = await import("drizzle-orm");

    const [[userCount], [productCount], [orderCount], [revenueResult]] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(users),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.isActive, true)),
        db.select({ count: sql<number>`count(*)::int` }).from(orders),
        db
          .select({
            revenue: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
          })
          .from(orders)
          .where(
            and(
              ne(orders.status, "cancelled"),
              ne(orders.status, "refunded"),
            ),
          ),
      ]);

    return {
      totalUsers: userCount?.count ?? 0,
      totalProducts: productCount?.count ?? 0,
      totalOrders: orderCount?.count ?? 0,
      totalRevenueCents: revenueResult?.revenue ?? 0,
    };
  } catch {
    return placeholderStats;
  }
}

async function getRecentOrders(): Promise<RecentOrder[]> {
  try {
    const { db, orders, users } = await import("@amazone/db");
    const { desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: orders.id,
        customer: users.name,
        totalCents: orders.totalInCents,
        status: orders.status,
        date: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return rows.map((row) => ({
      id: row.id.slice(0, 8).toUpperCase(),
      customer: row.customer,
      totalCents: row.totalCents,
      status: row.status as OrderStatus,
      date: row.date.toISOString().slice(0, 10),
    }));
  } catch {
    return placeholderRecentOrders;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const [stats, recentOrders] = await Promise.all([
    getStats(),
    getRecentOrders(),
  ]);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered accounts",
    },
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      description: "Listed products",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      description: "All-time orders",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenueCents),
      icon: DollarSign,
      description: "Lifetime revenue",
    },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide metrics and recent activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            The 5 most recent orders across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{formatPrice(order.totalCents)}</TableCell>
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
