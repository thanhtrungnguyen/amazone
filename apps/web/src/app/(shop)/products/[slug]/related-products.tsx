import { getRelatedProducts } from "@amazone/products";
import { ProductCard } from "@amazone/shared-ui";

interface RelatedProductsProps {
  productId: string;
}

export async function RelatedProducts({
  productId,
}: RelatedProductsProps): Promise<React.ReactElement | null> {
  const relatedProducts = await getRelatedProducts(productId);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {relatedProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            slug={product.slug}
            priceInCents={product.price}
            compareAtPriceInCents={product.compareAtPrice ?? undefined}
            image={product.images?.[0] ?? null}
            rating={product.avgRating}
            reviewCount={product.reviewCount}
          />
        ))}
      </div>
    </section>
  );
}
