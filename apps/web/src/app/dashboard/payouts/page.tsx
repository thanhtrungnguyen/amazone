import { redirect } from "next/navigation";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Clock,
  CalendarDays,
  TrendingUp,
  Download,
} from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Payouts -- Amazone Dashboard",
  description: "Track your seller earnings, pending payouts, and monthly revenue breakdown.",
};

// ---------- Types ----------

type DateRange = "30d" | "3m" | "6m" | "all";

interface EarningsSummary {
  totalEarnedInCents: number;
  pendingPayoutInCents: number;
  thisMonthInCents: number;
  lastMonthInCents: number;
}

interface MonthlyEarning {
  label: string;    // e.g. "Mar 2026"
  sortKey: string;  // e.g. "2026-03" — used for ordering, not rendered
  earningsInCents: number;
}

interface OrderEarningRow {
  orderId: string;
  orderDate: Date;
  itemsSold: number;
  grossEarningsInCents: number;
  status: string;
}

interface PayoutsData {
  summary: EarningsSummary;
  monthlyEarnings: MonthlyEarning[];
  orders: OrderEarningRow[];
}

// ---------- Helpers ----------

function rangeToStartDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (range === "3m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  // 6m
  const d = new Date(now);
  d.setMonth(d.getMonth() - 6);
  return d;
}

// Earned statuses: confirmed, processing, shipped, delivered
// Pending payout = confirmed + processing (payment captured but not yet fulfilled)
const EARNED_STATUSES = ["confirmed", "processing", "shipped", "delivered"] as const;
const PENDING_STATUSES = ["confirmed", "processing"] as const;

// ---------- Data fetching ----------

async function getPayoutsData(userId: string, range: DateRange): Promise<PayoutsData> {
  const defaultSummary: EarningsSummary = {
    totalEarnedInCents: 0,
    pendingPayoutInCents: 0,
    thisMonthInCents: 0,
    lastMonthInCents: 0,
  };

  try {
    const { db, products, orders, orderItems } = await import("@amazone/db");
    const { eq, and, inArray, sum, sql, desc } = await import("drizzle-orm");

    // Seller's product IDs
    const sellerProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sellerId, userId));

    const productIds = sellerProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return { summary: defaultSummary, monthlyEarnings: [], orders: [] };
    }

    // ── Summary figures (always all-time, independent of range filter) ──

    // Total earned (delivered + confirmed + processing + shipped)
    const totalEarnedResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, [...EARNED_STATUSES]),
        )
      );
    const totalEarnedInCents = Number(totalEarnedResult[0]?.total ?? 0);

    // Pending payout (confirmed + processing — payment captured, not yet shipped)
    const pendingResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, [...PENDING_STATUSES]),
        )
      );
    const pendingPayoutInCents = Number(pendingResult[0]?.total ?? 0);

    // This month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, [...EARNED_STATUSES]),
          sql`${orders.createdAt} >= ${startOfThisMonth}`,
        )
      );
    const thisMonthInCents = Number(thisMonthResult[0]?.total ?? 0);

    const lastMonthResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, [...EARNED_STATUSES]),
          sql`${orders.createdAt} >= ${startOfLastMonth}`,
          sql`${orders.createdAt} < ${endOfLastMonth}`,
        )
      );
    const lastMonthInCents = Number(lastMonthResult[0]?.total ?? 0);

    const summary: EarningsSummary = {
      totalEarnedInCents,
      pendingPayoutInCents,
      thisMonthInCents,
      lastMonthInCents,
    };

    // ── Range-filtered queries ──

    const rangeStart = rangeToStartDate(range);

    const rangeConditions = [
      inArray(orderItems.productId, productIds),
      inArray(orders.status, [...EARNED_STATUSES]),
      ...(rangeStart ? [sql`${orders.createdAt} >= ${rangeStart}`] : []),
    ] as const;

    // Monthly earnings timeline (within range)
    const monthlyRows = await db
      .select({
        monthLabel: sql<string>`to_char(${orders.createdAt}, 'Mon YYYY')`,
        monthSort: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        earnings: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...rangeConditions))
      .groupBy(
        sql`to_char(${orders.createdAt}, 'Mon YYYY')`,
        sql`to_char(${orders.createdAt}, 'YYYY-MM')`,
      )
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    const monthlyEarnings: MonthlyEarning[] = monthlyRows.map((row) => ({
      label: row.monthLabel,
      sortKey: row.monthSort,
      earningsInCents: Number(row.earnings ?? 0),
    }));

    // Order-level breakdown (within range)
    // Each row = one order that contains at least one of this seller's products.
    // We only sum the seller's items, not the full order total.
    const orderBreakdownRows = await db
      .select({
        orderId: orderItems.orderId,
        orderDate: orders.createdAt,
        orderStatus: orders.status,
        itemsSold: sum(orderItems.quantity),
        grossEarnings: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...rangeConditions))
      .groupBy(orderItems.orderId, orders.createdAt, orders.status)
      .orderBy(desc(orders.createdAt))
      .limit(200);

    const orders_result: OrderEarningRow[] = orderBreakdownRows.map((row) => ({
      orderId: row.orderId,
      orderDate: row.orderDate,
      itemsSold: Number(row.itemsSold ?? 0),
      grossEarningsInCents: Number(row.grossEarnings ?? 0),
      status: row.orderStatus,
    }));

    return { summary, monthlyEarnings, orders: orders_result };
  } catch {
    return { summary: defaultSummary, monthlyEarnings: [], orders: [] };
  }
}

// ---------- Sub-components ----------

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>
          {value}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
  return_requested: "destructive",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------- Range filter UI ----------

const RANGES: { value: DateRange; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "all", label: "All time" },
];

// ---------- Page ----------

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    redirect("/sign-in");
  }

  const resolvedParams = await searchParams;
  const rawRange = resolvedParams["range"];
  const range: DateRange =
    rawRange === "30d" || rawRange === "3m" || rawRange === "6m" || rawRange === "all"
      ? rawRange
      : "all";

  const { summary, monthlyEarnings, orders } = await getPayoutsData(session.user.id, range);

  const maxMonthly = Math.max(0, ...monthlyEarnings.map((m) => m.earningsInCents));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            Your earnings breakdown and payout history
          </p>
        </div>

        {/* CSV download — points to an API route that streams the CSV */}
        <Button variant="outline" asChild>
          <Link href={`/api/dashboard/payouts/csv?range=${range}`} prefetch={false}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Download CSV
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Earned"
          value={formatPrice(summary.totalEarnedInCents)}
          description="All time (confirmed orders)"
          icon={DollarSign}
        />
        <SummaryCard
          title="Pending Payout"
          value={formatPrice(summary.pendingPayoutInCents)}
          description="Confirmed, awaiting fulfillment"
          icon={Clock}
        />
        <SummaryCard
          title="This Month"
          value={formatPrice(summary.thisMonthInCents)}
          description="Current calendar month"
          icon={TrendingUp}
          highlight
        />
        <SummaryCard
          title="Last Month"
          value={formatPrice(summary.lastMonthInCents)}
          description="Previous calendar month"
          icon={CalendarDays}
        />
      </div>

      {/* Earnings timeline */}
      <Card className="mb-8">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Earnings Timeline</CardTitle>
            <CardDescription>Monthly earnings breakdown</CardDescription>
          </div>

          {/* Range filter links */}
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Date range filter"
          >
            {RANGES.map((r) => (
              <Link
                key={r.value}
                href={`/dashboard/payouts?range=${r.value}`}
                className={[
                  "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                  range === r.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
                aria-current={range === r.value ? "true" : undefined}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {monthlyEarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No earnings in the selected period.
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyEarnings.map((month) => {
                const percentage =
                  maxMonthly > 0
                    ? Math.round((month.earningsInCents / maxMonthly) * 100)
                    : 0;

                return (
                  <div key={month.sortKey} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm text-muted-foreground">
                      {month.label}
                    </span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-primary/80 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                        {formatPrice(month.earningsInCents)}
                      </span>
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order-level breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Breakdown</CardTitle>
          <CardDescription>
            {orders.length === 0
              ? "No orders in the selected period."
              : `${orders.length} order${orders.length !== 1 ? "s" : ""} — showing only your items from each order`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No orders found. Adjust the date range or wait for your first sale.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Gross Earnings</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="pl-6 font-mono text-xs">
                        <Link
                          href={`/dashboard/orders/${order.orderId}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {order.orderId.slice(0, 8)}&hellip;
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.itemsSold}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.grossEarningsInCents)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge
                          variant={statusVariant[order.status] ?? "outline"}
                          className="capitalize"
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
