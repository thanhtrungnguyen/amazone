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
import { db, products, users } from "@amazone/db";
import { eq, lte, and, asc } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
  sellerName: string;
}

async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      stock: products.stock,
      sellerName: users.name,
    })
    .from(products)
    .innerJoin(users, eq(products.sellerId, users.id))
    .where(
      and(
        eq(products.isActive, true),
        lte(products.stock, 5),
      ),
    )
    .orderBy(asc(products.stock))
    .limit(20);

  return rows;
}

function getStockBadgeVariant(stock: number): "destructive" | "secondary" {
  if (stock === 0) return "destructive";
  return "secondary";
}

function getStockLabel(stock: number): string {
  if (stock === 0) return "Out of stock";
  return `${stock} left`;
}

export async function InventoryAlerts(): Promise<React.ReactElement> {
  let lowStockProducts: LowStockProduct[];
  let error = false;

  try {
    lowStockProducts = await getLowStockProducts();
  } catch {
    lowStockProducts = [];
    error = true;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="h-5 w-5 text-orange-500"
            aria-hidden="true"
          />
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Active products with 5 or fewer units in stock
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">
            Failed to load inventory alerts.
          </p>
        ) : lowStockProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All products have healthy stock levels.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="max-w-[250px]">
                    <Link
                      href={`/products/${product.slug}`}
                      className="truncate font-medium text-primary hover:underline"
                    >
                      {product.name.length > 50
                        ? product.name.slice(0, 50) + "..."
                        : product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sellerName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStockBadgeVariant(product.stock)}>
                      {getStockLabel(product.stock)}
                    </Badge>
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
