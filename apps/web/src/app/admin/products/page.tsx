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
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductToggles } from "./product-toggles";

export const metadata = {
  title: "Products - Admin | Amazone",
  description: "Review, moderate, and manage all products on the platform.",
};

interface AdminProduct {
  id: string;
  name: string;
  seller: string;
  category: string | null;
  priceCents: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdDate: string;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getProducts(): Promise<AdminProduct[]> {
  try {
    const { db, products, users, categories } = await import("@amazone/db");
    const { desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        seller: users.name,
        category: categories.name,
        priceCents: products.price,
        stock: products.stock,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        createdDate: products.createdAt,
      })
      .from(products)
      .innerJoin(users, eq(products.sellerId, users.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      seller: row.seller,
      category: row.category,
      priceCents: row.priceCents,
      stock: row.stock,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      createdDate: row.createdDate.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminProductsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const products = await getProducts();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Review, moderate, and manage all products on the platform.
        </p>
      </div>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {products.length} products listed on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status / Featured</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>{product.seller}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category ?? "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.priceCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ProductToggles
                      productId={product.id}
                      isActive={product.isActive}
                      isFeatured={product.isFeatured}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.createdDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
