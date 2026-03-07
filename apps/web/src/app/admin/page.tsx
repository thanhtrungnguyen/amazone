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
import { Suspense } from "react";
import { TimePeriodSelect } from "./time-period-select";
import { RevenueChart } from "./revenue-chart";
import { OrdersStatusChart } from "./orders-status-chart";
import { TopProducts } from "./top-products";

export const metadata = {
  title: "Dashboard - Admin | Amazone",
  description: "Admin dashboard overview with platform-wide metrics.",
};

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

type PeriodKey = "7d" | "30d" | "90d" | "all";

const PERIOD_DAYS: Record<PeriodKey, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

function parsePeriod(param: string | undefined): number | null {
  if (param && param in PERIOD_DAYS) {
    return PERIOD_DAYS[param as PeriodKey];
  }
  return PERIOD_DAYS["30d"];
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
}

async function getStats(periodDays: number | null): Promise<DashboardStats> {
  const { db, users, products, orders } = await import("@amazone/db");
  const { sql, eq, and, ne, gte } = await import("drizzle-orm");

  const orderConditions = [
    ne(orders.status, "cancelled"),
    ne(orders.status, "refunded"),
  ];

  const orderTimeCondition =
    periodDays !== null
      ? gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`)
      : undefined;

  const userTimeCondition =
    periodDays !== null
      ? gte(users.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`)
      : undefined;

  const productTimeCondition =
    periodDays !== null
      ? gte(products.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`)
      : undefined;

  const [[userCount], [productCount], [orderCount], [revenueResult]] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(userTimeCondition),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(
          productTimeCondition
            ? and(eq(products.isActive, true), productTimeCondition)
            : eq(products.isActive, true),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(orderTimeCondition),
      db
        .select({
          revenue: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
        })
        .from(orders)
        .where(
          orderTimeCondition
            ? and(...orderConditions, orderTimeCondition)
            : and(...orderConditions),
        ),
    ]);

  return {
    totalUsers: userCount?.count ?? 0,
    totalProducts: productCount?.count ?? 0,
    totalOrders: orderCount?.count ?? 0,
    totalRevenueCents: revenueResult?.revenue ?? 0,
  };
}

interface RecentOrder {
  id: string;
  customer: string;
  totalCents: number;
  status: OrderStatus;
  date: string;
}

async function getRecentOrders(): Promise<RecentOrder[]> {
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
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function ChartSkeleton(): React.ReactElement {
  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-60 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface AdminDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const periodParam = typeof params.period === "string" ? params.period : undefined;
  const periodDays = parsePeriod(periodParam);

  let stats: DashboardStats | null = null;
  let statsError = false;
  try {
    stats = await getStats(periodDays);
  } catch {
    statsError = true;
  }

  let recentOrders: RecentOrder[] = [];
  let recentOrdersError = false;
  try {
    recentOrders = await getRecentOrders();
  } catch {
    recentOrdersError = true;
  }

  const periodLabel =
    periodDays !== null ? `Last ${periodDays} days` : "All time";

  const statCards = stats
    ? [
        {
          label: "Users",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          description: periodLabel,
        },
        {
          label: "Products",
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          description: periodLabel,
        },
        {
          label: "Orders",
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          description: periodLabel,
        },
        {
          label: "Revenue",
          value: formatPrice(stats.totalRevenueCents),
          icon: DollarSign,
          description: periodLabel,
        },
      ]
    : null;

  return (
    <div>
      {/* Header with time filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Platform-wide metrics and recent activity.
          </p>
        </div>
        <TimePeriodSelect />
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsError ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="py-6">
              <p className="text-sm text-destructive">
                Failed to load dashboard statistics.
              </p>
            </CardContent>
          </Card>
        ) : (
          statCards?.map((stat) => (
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
          ))
        )}
      </div>

      {/* Charts side by side */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart periodDays={periodDays} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <OrdersStatusChart periodDays={periodDays} />
        </Suspense>
      </div>

      {/* Top products */}
      <div className="mb-8">
        <Suspense fallback={<TableSkeleton />}>
          <TopProducts periodDays={periodDays} />
        </Suspense>
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
          {recentOrdersError ? (
            <p className="text-sm text-destructive">
              Failed to load recent orders.
            </p>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent orders.</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
