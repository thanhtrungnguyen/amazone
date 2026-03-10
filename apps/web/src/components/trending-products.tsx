import { getTrendingProducts } from "@amazone/products";
import { ProductRecommendations } from "@/components/product-recommendations";

export async function TrendingProducts(): Promise<React.ReactElement | null> {
  const result = await getTrendingProducts(6);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <ProductRecommendations
        title="Trending Now"
        products={result.data.map((p) => ({ ...p, badge: "Trending" }))}
        viewAllHref="/products?sortBy=newest"
      />
    </div>
  );
}
