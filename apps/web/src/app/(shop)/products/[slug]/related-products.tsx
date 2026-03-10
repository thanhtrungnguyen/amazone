import { getRelatedProducts } from "@amazone/products";
import { ProductRecommendations } from "@/components/product-recommendations";

interface RelatedProductsProps {
  productId: string;
}

export async function RelatedProducts({
  productId,
}: RelatedProductsProps): Promise<React.ReactElement | null> {
  const relatedProducts = await getRelatedProducts(productId, 6);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <ProductRecommendations
      title="Related Products"
      products={relatedProducts}
      viewAllHref="/products"
    />
  );
}
