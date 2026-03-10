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
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
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
import { TopSellers } from "./top-sellers";
import { RecentActivityFeed } from "./recent-activity-feed";
import { InventoryAlerts } from "./inventory-alerts";

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

interface PeriodStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
}

interface DashboardKpis {
  current: PeriodStats;
  previous: PeriodStats | null;
}

async function getKpis(periodDays: number | null): Promise<DashboardKpis> {
  const { db, users, products, orders } = await import("@amazone/db");
  const { sql, eq, and, ne, gte, lt } = await import("drizzle-orm");

  if (periodDays === null) {
    // "All time" — no comparison possible
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
          .where(and(ne(orders.status, "cancelled"), ne(orders.status, "refunded"))),
      ]);

    return {
      current: {
        totalUsers: userCount?.count ?? 0,
        totalProducts: productCount?.count ?? 0,
        totalOrders: orderCount?.count ?? 0,
        totalRevenueCents: revenueResult?.revenue ?? 0,
      },
      previous: null,
    };
  }

  // Helper to fetch stats for a given time window
  async function fetchRange(
    startInterval: string,
    endInterval?: string,
  ): Promise<PeriodStats> {
    const startCond = gte(
      orders.createdAt,
      sql`now() - interval '${sql.raw(startInterval)} days'`,
    );
    const userStart = gte(
      users.createdAt,
      sql`now() - interval '${sql.raw(startInterval)} days'`,
    );
    const productStart = gte(
      products.createdAt,
      sql`now() - interval '${sql.raw(startInterval)} days'`,
    );

    const endCondOrder = endInterval
      ? lt(orders.createdAt, sql`now() - interval '${sql.raw(endInterval)} days'`)
      : undefined;
    const endCondUser = endInterval
      ? lt(users.createdAt, sql`now() - interval '${sql.raw(endInterval)} days'`)
      : undefined;
    const endCondProduct = endInterval
      ? lt(products.createdAt, sql`now() - interval '${sql.raw(endInterval)} days'`)
      : undefined;

    const userWhere = endCondUser
      ? and(userStart, endCondUser)
      : userStart;
    const productWhere = endCondProduct
      ? and(eq(products.isActive, true), productStart, endCondProduct)
      : and(eq(products.isActive, true), productStart);
    const orderWhere = endCondOrder
      ? and(startCond, endCondOrder)
      : startCond;
    const revenueWhere = endCondOrder
      ? and(ne(orders.status, "cancelled"), ne(orders.status, "refunded"), startCond, endCondOrder)
      : and(ne(orders.status, "cancelled"), ne(orders.status, "refunded"), startCond);

    const [[userCount], [productCount], [orderCount], [revenueResult]] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(userWhere),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(productWhere),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(orderWhere),
        db
          .select({
            revenue: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
          })
          .from(orders)
          .where(revenueWhere),
      ]);

    return {
      totalUsers: userCount?.count ?? 0,
      totalProducts: productCount?.count ?? 0,
      totalOrders: orderCount?.count ?? 0,
      totalRevenueCents: revenueResult?.revenue ?? 0,
    };
  }

  const [current, previous] = await Promise.all([
    fetchRange(String(periodDays)),
    fetchRange(String(periodDays * 2), String(periodDays)),
  ]);

  return { current, previous };
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
// Percentage change helper
// ---------------------------------------------------------------------------

function computeChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null; // infinite growth, show as "new"
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function KpiCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

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

function ActivitySkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// KPI Change Indicator
// ---------------------------------------------------------------------------

interface ChangeIndicatorProps {
  change: number | null;
  periodDays: number | null;
}

function ChangeIndicator({ change, periodDays }: ChangeIndicatorProps): React.ReactElement {
  if (periodDays === null) {
    return (
      <span className="text-xs text-muted-foreground">All time</span>
    );
  }

  if (change === null) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        New
      </span>
    );
  }

  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" />
        0% vs prev {periodDays}d
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        +{change.toFixed(1)}% vs prev {periodDays}d
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-red-600">
      <TrendingDown className="h-3 w-3" aria-hidden="true" />
      {change.toFixed(1)}% vs prev {periodDays}d
    </span>
  );
}

// ---------------------------------------------------------------------------
// Async KPI Row (Suspense-wrapped)
// ---------------------------------------------------------------------------

interface KpiRowProps {
  periodDays: number | null;
}

async function KpiRow({ periodDays }: KpiRowProps): Promise<React.ReactElement> {
  let kpis: DashboardKpis;

  try {
    kpis = await getKpis(periodDays);
  } catch {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Failed to load dashboard statistics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { current, previous } = kpis;

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(current.totalRevenueCents),
      icon: DollarSign,
      change: previous
        ? computeChange(current.totalRevenueCents, previous.totalRevenueCents)
        : null,
      iconColor: "text-green-600",
    },
    {
      label: "Total Orders",
      value: current.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      change: previous
        ? computeChange(current.totalOrders, previous.totalOrders)
        : null,
      iconColor: "text-blue-600",
    },
    {
      label: "Total Customers",
      value: current.totalUsers.toLocaleString(),
      icon: Users,
      change: previous
        ? computeChange(current.totalUsers, previous.totalUsers)
        : null,
      iconColor: "text-purple-600",
    },
    {
      label: "Total Products",
      value: current.totalProducts.toLocaleString(),
      icon: Package,
      change: previous
        ? computeChange(current.totalProducts, previous.totalProducts)
        : null,
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.label}
            </CardTitle>
            <stat.icon
              className={`h-4 w-4 ${stat.iconColor}`}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="mt-1">
              <ChangeIndicator
                change={stat.change}
                periodDays={periodDays}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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

      {/* KPI Stats cards with % change */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <KpiCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <KpiRow periodDays={periodDays} />
        </Suspense>
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

      {/* Top sellers + Recent activity side by side */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<TableSkeleton />}>
          <TopSellers periodDays={periodDays} />
        </Suspense>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivityFeed />
        </Suspense>
      </div>

      {/* Inventory alerts */}
      <div className="mb-8">
        <Suspense fallback={<TableSkeleton />}>
          <InventoryAlerts />
        </Suspense>
      </div>

      {/* Top products */}
      <div className="mb-8">
        <Suspense fallback={<TableSkeleton />}>
          <TopProducts periodDays={periodDays} />
        </Suspense>
      </div>

      {/* Recent orders table */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrdersTable />
      </Suspense>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent orders (extracted to async component for Suspense)
// ---------------------------------------------------------------------------

async function RecentOrdersTable(): Promise<React.ReactElement> {
  let recentOrders: RecentOrder[];
  let error = false;

  try {
    recentOrders = await getRecentOrders();
  } catch {
    recentOrders = [];
    error = true;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          The 5 most recent orders across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
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
  );
}
