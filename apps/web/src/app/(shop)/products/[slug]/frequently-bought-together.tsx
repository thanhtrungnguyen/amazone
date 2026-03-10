import { getFrequentlyBoughtTogether } from "@amazone/products";
import { ProductRecommendations } from "@/components/product-recommendations";

interface FrequentlyBoughtTogetherProps {
  productId: string;
}

export async function FrequentlyBoughtTogether({
  productId,
}: FrequentlyBoughtTogetherProps): Promise<React.ReactElement | null> {
  const result = await getFrequentlyBoughtTogether(productId, 6);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  return (
    <ProductRecommendations
      title="Frequently Bought Together"
      products={result.data}
    />
  );
}
