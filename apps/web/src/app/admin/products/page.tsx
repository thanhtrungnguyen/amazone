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

export const metadata = {
  title: "Products - Admin | Amazone",
  description: "Review, moderate, and manage all products on the platform.",
};

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

type ProductStatus = "active" | "pending" | "rejected";

interface AdminProduct {
  id: string;
  name: string;
  seller: string;
  priceCents: number;
  stock: number;
  status: ProductStatus;
  createdDate: string;
}

const products: AdminProduct[] = [
  {
    id: "prod-001",
    name: 'Ultra HD Monitor 27"',
    seller: "Alice Johnson",
    priceCents: 34999,
    stock: 142,
    status: "active",
    createdDate: "2025-12-01",
  },
  {
    id: "prod-002",
    name: "Wireless Mechanical Keyboard",
    seller: "Alice Johnson",
    priceCents: 12999,
    stock: 305,
    status: "active",
    createdDate: "2025-12-15",
  },
  {
    id: "prod-003",
    name: "Noise Cancelling Headphones Pro",
    seller: "Charlie Nguyen",
    priceCents: 24900,
    stock: 58,
    status: "pending",
    createdDate: "2026-02-20",
  },
  {
    id: "prod-004",
    name: "Ergonomic Office Chair",
    seller: "Charlie Nguyen",
    priceCents: 49999,
    stock: 23,
    status: "active",
    createdDate: "2026-01-10",
  },
  {
    id: "prod-005",
    name: "Counterfeit Designer Watch",
    seller: "Bob Smith",
    priceCents: 9999,
    stock: 0,
    status: "rejected",
    createdDate: "2026-03-01",
  },
  {
    id: "prod-006",
    name: "USB-C Hub 7-in-1",
    seller: "Alice Johnson",
    priceCents: 3999,
    stock: 720,
    status: "active",
    createdDate: "2026-02-28",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadgeClasses(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminProductsPage(): React.ReactElement {
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
