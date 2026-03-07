import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, orders } from "@amazone/db";
import { sql, gte } from "drizzle-orm";
import type { OrderStatus } from "@amazone/shared-utils";

interface StatusCount {
  status: OrderStatus;
  count: number;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-indigo-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-orange-500",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

async function getOrdersByStatus(
  periodDays: number | null,
): Promise<StatusCount[]> {
  const conditions = [];

  if (periodDays !== null) {
    conditions.push(
      gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`),
    );
  }

  const rows = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .groupBy(orders.status);

  return rows.map((row) => ({
    status: row.status as OrderStatus,
    count: row.count,
  }));
}

interface OrdersStatusChartProps {
  periodDays: number | null;
}

export async function OrdersStatusChart({
  periodDays,
}: OrdersStatusChartProps): Promise<React.ReactElement> {
  let statusCounts: StatusCount[];
  let error = false;

  try {
    statusCounts = await getOrdersByStatus(periodDays);
  } catch {
    statusCounts = [];
    error = true;
  }

  const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const maxCount = Math.max(...statusCounts.map((s) => s.count), 1);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>
          Breakdown of {totalOrders.toLocaleString()} orders by current status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Failed to load order status data.</p>
        ) : statusCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders for this period.</p>
        ) : (
          <div className="space-y-3">
            {statusCounts
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const widthPercent = (item.count / maxCount) * 100;
                const percentage =
                  totalOrders > 0
                    ? ((item.count / totalOrders) * 100).toFixed(1)
                    : "0";

                return (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-5 w-full rounded bg-muted">
                      <div
                        className={`h-5 rounded ${STATUS_COLORS[item.status]} transition-all`}
                        style={{ width: `${Math.max(widthPercent, 1)}%` }}
                        role="img"
                        aria-label={`${STATUS_LABELS[item.status]}: ${item.count} orders (${percentage}%)`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
