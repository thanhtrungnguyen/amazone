import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@amazone/shared-utils";
import { db, orders } from "@amazone/db";
import { sql, and, ne, gte } from "drizzle-orm";

interface DailyRevenue {
  date: string;
  totalCents: number;
}

async function getDailyRevenue(
  periodDays: number | null,
): Promise<DailyRevenue[]> {
  const conditions = [
    ne(orders.status, "cancelled"),
    ne(orders.status, "refunded"),
  ];

  if (periodDays !== null) {
    conditions.push(
      gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`),
    );
  }

  const rows = await db
    .select({
      date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      totalCents: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  return rows;
}

interface RevenueChartProps {
  periodDays: number | null;
}

export async function RevenueChart({
  periodDays,
}: RevenueChartProps): Promise<React.ReactElement> {
  let dailyRevenue: DailyRevenue[];
  let error = false;

  try {
    dailyRevenue = await getDailyRevenue(periodDays);
  } catch {
    dailyRevenue = [];
    error = true;
  }

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.totalCents), 1);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
        <CardDescription>
          Daily revenue{periodDays !== null ? ` for the last ${periodDays} days` : " (all time)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Failed to load revenue data.</p>
        ) : dailyRevenue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue data for this period.</p>
        ) : (
          <div className="space-y-2">
            {dailyRevenue.map((day) => {
              const widthPercent = (day.totalCents / maxRevenue) * 100;
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {day.date}
                  </span>
                  <div className="flex-1">
                    <div
                      className="h-6 rounded bg-primary transition-all"
                      style={{ width: `${Math.max(widthPercent, 1)}%` }}
                      role="img"
                      aria-label={`${day.date}: ${formatPrice(day.totalCents)}`}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-medium">
                    {formatPrice(day.totalCents)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
