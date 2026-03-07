import { redirect } from "next/navigation";
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
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Star,
} from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Analytics -- Amazone Dashboard",
  description: "View your seller performance metrics and revenue analytics.",
};

// ---------- Types ----------

interface StatCard {
  title: string;
  value: string;
  icon: typeof DollarSign;
}

interface RevenueDay {
  date: string;
  revenueInCents: number;
}

interface TopProduct {
  name: string;
  unitsSold: number;
  revenueInCents: number;
}

interface ActivityEvent {
  id: string;
  type: "order" | "review";
  message: string;
  timestamp: string;
}

const activityIcons: Record<ActivityEvent["type"], typeof ShoppingCart> = {
  order: ShoppingCart,
  review: Star,
};

// ---------- Data fetching ----------

interface AnalyticsData {
  stats: StatCard[];
  revenueByDay: RevenueDay[];
  topProducts: TopProduct[];
  recentActivity: ActivityEvent[];
}

async function getAnalyticsData(userId: string, isAdmin: boolean): Promise<AnalyticsData> {
  try {
    const { db, products, orders, orderItems, reviews } = await import("@amazone/db");
    const { eq, and, ne, desc, sum, sql, inArray } = await import("drizzle-orm");

    // Get seller's product IDs (admins see all)
    const sellerProducts = isAdmin
      ? await db.select({ id: products.id, name: products.name }).from(products)
      : await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.sellerId, userId));

    const productIds = sellerProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return { stats: defaultStats(), revenueByDay: [], topProducts: [], recentActivity: [] };
    }

    // Total revenue from delivered/confirmed/shipped orders
    const revenueResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          ne(orders.status, "cancelled"),
          ne(orders.status, "refunded"),
        )
      );
    const totalRevenue = Number(revenueResult[0]?.total ?? 0);

    // Total orders (distinct)
    const orderCountResult = await db
      .selectDistinct({ orderId: orderItems.orderId })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          ne(orders.status, "cancelled"),
          ne(orders.status, "refunded"),
        )
      );
    const totalOrders = orderCountResult.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const computedStats: StatCard[] = [
      { title: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign },
      { title: "Total Orders", value: String(totalOrders), icon: ShoppingCart },
      { title: "Avg Order Value", value: formatPrice(avgOrderValue), icon: BarChart3 },
      { title: "Products", value: String(productIds.length), icon: TrendingUp },
    ];

    // Top products by revenue
    const topProductsResult = await db
      .select({
        productId: orderItems.productId,
        unitsSold: sum(orderItems.quantity),
        revenue: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          ne(orders.status, "cancelled"),
          ne(orders.status, "refunded"),
        )
      )
      .groupBy(orderItems.productId)
      .orderBy(desc(sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`)))
      .limit(5);

    const productNameMap = new Map(sellerProducts.map((p) => [p.id, p.name]));
    const topProductsMapped: TopProduct[] = topProductsResult.map((row) => ({
      name: productNameMap.get(row.productId) ?? "Unknown Product",
      unitsSold: Number(row.unitsSold ?? 0),
      revenueInCents: Number(row.revenue ?? 0),
    }));

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await db
      .select({
        day: sql<string>`to_char(${orders.createdAt}, 'Mon DD')`,
        revenue: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          inArray(orderItems.productId, productIds),
          ne(orders.status, "cancelled"),
          ne(orders.status, "refunded"),
          sql`${orders.createdAt} >= ${sevenDaysAgo}`,
        )
      )
      .groupBy(sql`to_char(${orders.createdAt}, 'Mon DD')`, sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

    const revenueByDayMapped: RevenueDay[] = dailyRevenue.map((row) => ({
      date: row.day,
      revenueInCents: Number(row.revenue ?? 0),
    }));

    // Recent activity: recent orders + reviews for seller's products
    const recentOrders = await db.query.orders.findMany({
      where: inArray(
        orders.id,
        db.selectDistinct({ id: orderItems.orderId }).from(orderItems).where(inArray(orderItems.productId, productIds))
      ),
      orderBy: desc(orders.createdAt),
      limit: 3,
      with: { user: { columns: { name: true } } },
    });

    const recentReviews = await db.query.reviews.findMany({
      where: inArray(reviews.productId, productIds),
      orderBy: desc(reviews.createdAt),
      limit: 2,
      with: {
        user: { columns: { name: true } },
        product: { columns: { name: true } },
      },
    });

    const activity: ActivityEvent[] = [
      ...recentOrders.map((o) => ({
        id: o.id,
        type: "order" as const,
        message: `New order from ${(o as unknown as { user: { name: string } }).user?.name ?? "Customer"} for ${formatPrice(o.totalInCents)}`,
        timestamp: timeAgo(o.createdAt),
      })),
      ...recentReviews.map((r) => ({
        id: r.id,
        type: "review" as const,
        message: `New ${r.rating}-star review on "${(r as unknown as { product: { name: string } }).product?.name ?? "Product"}"`,
        timestamp: timeAgo(r.createdAt),
      })),
    ].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(0, 5);

    return {
      stats: computedStats,
      revenueByDay: revenueByDayMapped,
      topProducts: topProductsMapped,
      recentActivity: activity,
    };
  } catch {
    return {
      stats: defaultStats(),
      revenueByDay: [],
      topProducts: [],
      recentActivity: [],
    };
  }
}

function defaultStats(): StatCard[] {
  return [
    { title: "Total Revenue", value: "$0.00", icon: DollarSign },
    { title: "Total Orders", value: "0", icon: ShoppingCart },
    { title: "Avg Order Value", value: "$0.00", icon: BarChart3 },
    { title: "Products", value: "0", icon: TrendingUp },
  ];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

// ---------- Component ----------

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    redirect("/sign-in");
  }
  const isAdmin = session.user.role === "admin";
  const { stats, revenueByDay, topProducts, recentActivity } = await getAnalyticsData(session.user.id, isAdmin);
  const maxRevenue = Math.max(0, ...revenueByDay.map((d) => d.revenueInCents));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your store performance and revenue trends
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">&nbsp;</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByDay.map((day) => {
                const percentage =
                  maxRevenue > 0
                    ? Math.round((day.revenueInCents / maxRevenue) * 100)
                    : 0;

                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-sm text-muted-foreground">
                      {day.date}
                    </span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-primary/80 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                        {formatPrice(day.revenueInCents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="pr-6 text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="max-w-[200px] truncate pl-6 font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.unitsSold}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium">
                      {formatPrice(product.revenueInCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest events from your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((event) => {
              const Icon = activityIcons[event.type];
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{event.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {event.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
