import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type DateRange = "30d" | "3m" | "6m" | "all";

const EARNED_STATUSES = ["confirmed", "processing", "shipped", "delivered"] as const;

function rangeToStartDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const d = new Date(now);
  if (range === "30d") { d.setDate(d.getDate() - 30); return d; }
  if (range === "3m") { d.setMonth(d.getMonth() - 3); return d; }
  d.setMonth(d.getMonth() - 6);
  return d;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawRange = request.nextUrl.searchParams.get("range");
  const range: DateRange =
    rawRange === "30d" || rawRange === "3m" || rawRange === "6m" || rawRange === "all"
      ? rawRange
      : "all";

  try {
    const { db, products, orders, orderItems } = await import("@amazone/db");
    const { eq, and, inArray, sum, sql, desc } = await import("drizzle-orm");

    const sellerProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sellerId, session.user.id));

    const productIds = sellerProducts.map((p) => p.id);

    if (productIds.length === 0) {
      const csv = "Order ID,Date,Items Sold,Gross Earnings (USD),Status\n";
      return buildCsvResponse(csv);
    }

    const rangeStart = rangeToStartDate(range);

    const rows = await db
      .select({
        orderId: orderItems.orderId,
        orderDate: orders.createdAt,
        orderStatus: orders.status,
        itemsSold: sum(orderItems.quantity),
        grossEarnings: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          inArray(orders.status, [...EARNED_STATUSES]),
          ...(rangeStart ? [sql`${orders.createdAt} >= ${rangeStart}`] : []),
        )
      )
      .groupBy(orderItems.orderId, orders.createdAt, orders.status)
      .orderBy(desc(orders.createdAt))
      .limit(10000);

    const header = "Order ID,Date,Items Sold,Gross Earnings (USD),Status\n";
    const body = rows
      .map((row) => {
        const earningsDollars = (Number(row.grossEarnings ?? 0) / 100).toFixed(2);
        const dateStr = row.orderDate.toISOString().slice(0, 10);
        return [
          escapeCsv(row.orderId),
          escapeCsv(dateStr),
          escapeCsv(String(Number(row.itemsSold ?? 0))),
          escapeCsv(earningsDollars),
          escapeCsv(row.orderStatus),
        ].join(",");
      })
      .join("\n");

    return buildCsvResponse(header + body);
  } catch {
    return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
  }
}

function buildCsvResponse(csv: string): NextResponse {
  const filename = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
