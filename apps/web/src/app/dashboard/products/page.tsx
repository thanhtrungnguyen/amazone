import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";
import { formatPrice } from "@amazone/shared-utils";
import { EmptyState } from "@amazone/shared-ui";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "My Products — Amazone Dashboard",
};

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  images: (string | null)[] | null;
  createdAt: Date;
}

async function getSellerProducts(
  userId: string,
  isAdmin: boolean
): Promise<SellerProduct[]> {
  try {
    const { db, products } = await import("@amazone/db");
    const { desc, eq } = await import("drizzle-orm");

    const result = await db.query.products.findMany({
      ...(isAdmin ? {} : { where: eq(products.sellerId, userId) }),
      orderBy: desc(products.createdAt),
      limit: 50,
    });

    return result.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
      images: p.images,
      createdAt: p.createdAt,
    }));
  } catch {
    return [];
  }
}

export default async function DashboardProductsPage() {
  const session = await auth();
  if (!session?.user?.id || !["seller", "admin"].includes(session.user.role ?? "")) {
    redirect("/sign-in");
  }
  const isAdmin = session.user.role === "admin";
  const products = await getSellerProducts(session.user.id, isAdmin);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product listings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No products yet"
          description="Create your first product to start selling."
          action={
            <Button asChild>
              <Link href="/dashboard/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-gray-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.reviewCount} reviews
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.stock} in stock
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex gap-2">
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                    >
                      {product.isActive ? "Active" : "Draft"}
                    </Badge>
                    {product.isFeatured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                    {product.stock === 0 && (
                      <Badge variant="destructive">Out of stock</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
