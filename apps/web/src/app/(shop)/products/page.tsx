import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductGridSkeleton } from "@amazone/shared-ui";

export const metadata = {
  title: "Products — Amazone",
  description: "Browse our full product catalog",
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Browse our full catalog of products
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." className="w-64 pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", "Electronics", "Clothing", "Books", "Home", "Sports"].map(
          (cat) => (
            <Badge
              key={cat}
              variant={cat === "All" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {cat}
            </Badge>
          )
        )}
      </div>

      {/* Product grid */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <div className="flex flex-col items-center gap-8 py-16 text-center">
          <p className="text-muted-foreground">
            Connect your database and seed products to see them here.
          </p>
          <p className="text-sm text-muted-foreground">
            Run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              docker compose up -d
            </code>{" "}
            then{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              pnpm db:migrate
            </code>
          </p>
        </div>
      </Suspense>
    </div>
  );
}
