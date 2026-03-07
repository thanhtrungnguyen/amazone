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
import { db, orders, orderItems, products } from "@amazone/db";
import { sql, and, ne, gte, eq, desc } from "drizzle-orm";
import Image from "next/image";

interface TopProduct {
  productId: string;
  name: string;
  image: string | null;
  unitsSold: number;
  revenueCents: number;
  avgRating: number;
}

async function getTopProducts(
  periodDays: number | null,
): Promise<TopProduct[]> {
  const conditions = [
    ne(orders.status, "cancelled"),
    ne(orders.status, "refunded"),
    eq(orderItems.orderId, orders.id),
    eq(orderItems.productId, products.id),
  ];

  if (periodDays !== null) {
    conditions.push(
      gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`),
    );
  }

  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      image: sql<string | null>`${products.images}[1]`,
      unitsSold: sql<number>`sum(${orderItems.quantity})::int`,
      revenueCents: sql<number>`sum(${orderItems.priceInCents} * ${orderItems.quantity})::int`,
      avgRating: products.avgRating,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        ne(orders.status, "cancelled"),
        ne(orders.status, "refunded"),
        ...(periodDays !== null
          ? [gte(orders.createdAt, sql`now() - interval '${sql.raw(String(periodDays))} days'`)]
          : []),
      ),
    )
    .groupBy(products.id, products.name, products.images, products.avgRating)
    .orderBy(desc(sql`sum(${orderItems.priceInCents} * ${orderItems.quantity})`))
    .limit(10);

  return rows.map((row) => ({
    productId: row.productId,
    name: row.name,
    image: row.image,
    unitsSold: row.unitsSold,
    revenueCents: row.revenueCents,
    avgRating: row.avgRating,
  }));
}

function formatRating(avgRating: number): string {
  return (avgRating / 100).toFixed(2);
}

interface TopProductsProps {
  periodDays: number | null;
}

export async function TopProducts({
  periodDays,
}: TopProductsProps): Promise<React.ReactElement> {
  let topProducts: TopProduct[];
  let error = false;

  try {
    topProducts = await getTopProducts(periodDays);
  } catch {
    topProducts = [];
    error = true;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products by Revenue</CardTitle>
        <CardDescription>
          Top 10 best-selling products{periodDays !== null ? ` in the last ${periodDays} days` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Failed to load top products.</p>
        ) : topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No product sales for this period.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted" aria-hidden="true" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.unitsSold.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.revenueCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.avgRating > 0 ? formatRating(product.avgRating) : "N/A"}
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
