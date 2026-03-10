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
import { db, orders, orderItems, products, users } from "@amazone/db";
import { sql, and, ne, gte, eq, desc } from "drizzle-orm";
import { Trophy } from "lucide-react";

interface TopSeller {
  sellerId: string;
  sellerName: string;
  sellerImage: string | null;
  revenueCents: number;
  productCount: number;
  orderCount: number;
}

async function getTopSellers(
  periodDays: number | null,
): Promise<TopSeller[]> {
  const timeConditions = periodDays !== null
    ? [gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`)]
    : [];

  const rows = await db
    .select({
      sellerId: products.sellerId,
      sellerName: users.name,
      sellerImage: users.image,
      revenueCents: sql<number>`coalesce(sum(${orderItems.priceInCents} * ${orderItems.quantity}), 0)::int`,
      productCount: sql<number>`count(distinct ${products.id})::int`,
      orderCount: sql<number>`count(distinct ${orders.id})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(users, eq(products.sellerId, users.id))
    .where(
      and(
        ne(orders.status, "cancelled"),
        ne(orders.status, "refunded"),
        ...timeConditions,
      ),
    )
    .groupBy(products.sellerId, users.name, users.image)
    .orderBy(desc(sql`sum(${orderItems.priceInCents} * ${orderItems.quantity})`))
    .limit(5);

  return rows;
}

const RANK_COLORS = [
  "text-yellow-500",
  "text-gray-400",
  "text-amber-600",
  "text-muted-foreground",
  "text-muted-foreground",
];

interface TopSellersProps {
  periodDays: number | null;
}

export async function TopSellers({
  periodDays,
}: TopSellersProps): Promise<React.ReactElement> {
  let sellers: TopSeller[];
  let error = false;

  try {
    sellers = await getTopSellers(periodDays);
  } catch {
    sellers = [];
    error = true;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
          <div>
            <CardTitle>Top Sellers</CardTitle>
            <CardDescription>
              Top 5 sellers by revenue{periodDays !== null ? ` in the last ${periodDays} days` : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Failed to load top sellers.</p>
        ) : sellers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No seller data for this period.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Rank</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller, index) => (
                <TableRow key={seller.sellerId}>
                  <TableCell>
                    <span
                      className={`text-lg font-bold ${RANK_COLORS[index] ?? "text-muted-foreground"}`}
                    >
                      #{index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {seller.sellerImage ? (
                        <img
                          src={seller.sellerImage}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                          aria-hidden="true"
                        >
                          {seller.sellerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="max-w-[200px] truncate">
                        {seller.sellerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(seller.revenueCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    {seller.productCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {seller.orderCount.toLocaleString()}
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
