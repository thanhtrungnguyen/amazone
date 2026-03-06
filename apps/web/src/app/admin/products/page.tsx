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

export const metadata = {
  title: "Products - Admin | Amazone",
  description: "Review, moderate, and manage all products on the platform.",
};

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

type ProductStatus = "active" | "inactive";

interface AdminProduct {
  id: string;
  name: string;
  seller: string;
  category: string | null;
  priceCents: number;
  stock: number;
  status: ProductStatus;
  createdDate: string;
}

const placeholderProducts: AdminProduct[] = [
  {
    id: "prod-001",
    name: 'Ultra HD Monitor 27"',
    seller: "Alice Johnson",
    category: "Electronics",
    priceCents: 34999,
    stock: 142,
    status: "active",
    createdDate: "2025-12-01",
  },
  {
    id: "prod-002",
    name: "Wireless Mechanical Keyboard",
    seller: "Alice Johnson",
    category: "Electronics",
    priceCents: 12999,
    stock: 305,
    status: "active",
    createdDate: "2025-12-15",
  },
  {
    id: "prod-003",
    name: "Noise Cancelling Headphones Pro",
    seller: "Charlie Nguyen",
    category: "Electronics",
    priceCents: 24900,
    stock: 58,
    status: "active",
    createdDate: "2026-02-20",
  },
  {
    id: "prod-004",
    name: "Ergonomic Office Chair",
    seller: "Charlie Nguyen",
    category: "Home & Kitchen",
    priceCents: 49999,
    stock: 23,
    status: "active",
    createdDate: "2026-01-10",
  },
  {
    id: "prod-005",
    name: "Counterfeit Designer Watch",
    seller: "Bob Smith",
    category: null,
    priceCents: 9999,
    stock: 0,
    status: "inactive",
    createdDate: "2026-03-01",
  },
  {
    id: "prod-006",
    name: "USB-C Hub 7-in-1",
    seller: "Alice Johnson",
    category: "Electronics",
    priceCents: 3999,
    stock: 720,
    status: "active",
    createdDate: "2026-02-28",
  },
];

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
      status: row.isActive ? ("active" as const) : ("inactive" as const),
      createdDate: row.createdDate.toISOString().slice(0, 10),
    }));
  } catch {
    return placeholderProducts;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadgeClasses(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-red-100 text-red-800 border-red-200";
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
                <TableHead>Status</TableHead>
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
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(product.status)}`}
                    >
                      {product.status.charAt(0).toUpperCase() +
                        product.status.slice(1)}
                    </span>
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
