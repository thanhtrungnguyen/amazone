import {
  getRandomActiveCategory,
  getPopularInCategory,
} from "@amazone/products";
import { ProductRecommendations } from "@/components/product-recommendations";

export async function PopularInCategory(): Promise<React.ReactElement | null> {
  const categoryResult = await getRandomActiveCategory();

  if (!categoryResult.success) {
    return null;
  }

  const category = categoryResult.data;
  const productsResult = await getPopularInCategory(category.id, 6);

  if (!productsResult.success || productsResult.data.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <ProductRecommendations
        title={`Popular in ${category.name}`}
        products={productsResult.data}
        viewAllHref={`/categories/${category.slug}`}
      />
    </div>
  );
}
