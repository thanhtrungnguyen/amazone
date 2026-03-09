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
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Seller Dashboard -- Amazone",
  description: "View your seller dashboard with sales overview, recent orders, and top products.",
};

// ---------- Types ----------

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
}

interface RecentOrder {
  id: string;
  customerName: string;
  totalInCents: number;
  status: string;
  createdAt: Date;
}

interface TopProduct {
  name: string;
  unitsSold: number;
  revenueInCents: number;
}

// ---------- Data fetching ----------

interface DashboardData {
  stats: StatCard[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    const { db, products, orders, orderItems } = await import("@amazone/db");
    const { eq, and, ne, desc, sum, sql, inArray } = await import("drizzle-orm");

    // Get seller's product IDs
    const sellerProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.sellerId, userId));

    const productIds = sellerProducts.map((p) => p.id);
    const totalProducts = productIds.length;

    if (totalProducts === 0) {
      return {
        stats: defaultStats(),
        recentOrders: [],
        topProducts: [],
      };
    }

    // Base filter: order items for seller's products, excluding cancelled/refunded
    const baseFilter = and(
      inArray(orderItems.productId, productIds),
      ne(orders.status, "cancelled"),
      ne(orders.status, "refunded"),
    );

    // Total revenue
    const revenueResult = await db
      .select({ total: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`) })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(baseFilter);
    const totalRevenue = Number(revenueResult[0]?.total ?? 0);

    // Total orders (distinct)
    const orderCountResult = await db
      .selectDistinct({ orderId: orderItems.orderId })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(baseFilter);
    const totalOrders = orderCountResult.length;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const stats: StatCard[] = [
      {
        title: "Total Revenue",
        value: formatPrice(totalRevenue),
        description: totalOrders > 0 ? `From ${totalOrders} order${totalOrders !== 1 ? "s" : ""}` : "No sales yet",
        icon: DollarSign,
      },
      {
        title: "Orders",
        value: String(totalOrders),
        description: totalOrders > 0 ? "Across all products" : "No orders yet",
        icon: ShoppingCart,
      },
      {
        title: "Products",
        value: String(totalProducts),
        description: `${totalProducts} product${totalProducts !== 1 ? "s" : ""} listed`,
        icon: Package,
      },
      {
        title: "Avg Order Value",
        value: formatPrice(avgOrderValue),
        description: totalOrders > 0 ? "Per order average" : "Start selling to track",
        icon: TrendingUp,
      },
    ];

    // Recent orders (last 10) involving this seller's products
    const recentOrderIds = await db
      .selectDistinct({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(inArray(orderItems.productId, productIds));

    const recentOrderIdList = recentOrderIds.map((r) => r.orderId);

    let recentOrders: RecentOrder[] = [];
    if (recentOrderIdList.length > 0) {
      const orderRows = await db.query.orders.findMany({
        where: inArray(orders.id, recentOrderIdList),
        orderBy: desc(orders.createdAt),
        limit: 10,
        with: { user: { columns: { name: true } } },
      });

      recentOrders = orderRows.map((o) => ({
        id: o.id,
        customerName: (o as unknown as { user: { name: string } }).user?.name ?? "Customer",
        totalInCents: o.totalInCents,
        status: o.status,
        createdAt: o.createdAt,
      }));
    }

    // Top-selling products by revenue (top 5)
    const topProductsResult = await db
      .select({
        productId: orderItems.productId,
        unitsSold: sum(orderItems.quantity),
        revenue: sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(baseFilter)
      .groupBy(orderItems.productId)
      .orderBy(desc(sum(sql`${orderItems.priceInCents} * ${orderItems.quantity}`)))
      .limit(5);

    const productNameMap = new Map(sellerProducts.map((p) => [p.id, p.name]));
    const topProducts: TopProduct[] = topProductsResult.map((row) => ({
      name: productNameMap.get(row.productId) ?? "Unknown Product",
      unitsSold: Number(row.unitsSold ?? 0),
      revenueInCents: Number(row.revenue ?? 0),
    }));

    return { stats, recentOrders, topProducts };
  } catch {
    return {
      stats: defaultStats(),
      recentOrders: [],
      topProducts: [],
    };
  }
}

function defaultStats(): StatCard[] {
  return [
    { title: "Total Revenue", value: "$0.00", description: "No sales yet", icon: DollarSign },
    { title: "Orders", value: "0", description: "No orders yet", icon: ShoppingCart },
    { title: "Products", value: "0", description: "No products listed", icon: Package },
    { title: "Avg Order Value", value: "$0.00", description: "Start selling to track", icon: TrendingUp },
  ];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

// ---------- Component ----------

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    redirect("/sign-in");
  }

  const { stats, recentOrders, topProducts } = await getDashboardData(session.user.id);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name ?? "Seller"}
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
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <CardDescription>Latest orders for your products</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No orders yet. Once customers purchase your products, they will appear here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6 text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="max-w-[140px] truncate pl-6 font-medium">
                        {order.customerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] ?? "outline"} className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.totalInCents)}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                        {timeAgo(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No product sales data yet. Your top-selling products will appear here.
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
