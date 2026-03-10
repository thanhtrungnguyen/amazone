import { Suspense } from "react";
import type { QuestionWithAnswers } from "@amazone/reviews";
import { ProductQAClient } from "./product-qa-client";

interface ProductQAListProps {
  productId: string;
  sellerId: string;
}

async function fetchQuestions(
  productId: string
): Promise<{ questions: QuestionWithAnswers[]; total: number }> {
  try {
    const { getProductQuestions } = await import("@amazone/reviews");
    return await getProductQuestions(productId, 5, 0);
  } catch {
    return { questions: [], total: 0 };
  }
}

export async function ProductQAList({
  productId,
  sellerId,
}: ProductQAListProps): Promise<React.ReactElement> {
  const { questions, total } = await fetchQuestions(productId);

  return (
    <ProductQAClient
      productId={productId}
      sellerId={sellerId}
      initialQuestions={questions}
      initialTotal={total}
      pageSize={5}
    />
  );
}

export function ProductQAListSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Q&A">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          <div className="ml-4 space-y-2 rounded border-l-2 pl-4">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductQA({
  productId,
  sellerId,
}: ProductQAListProps): React.ReactElement {
  return (
    <section aria-label="Customer questions and answers">
      <h2 className="mb-4 text-xl font-bold">
        Customer Questions &amp; Answers
      </h2>
      <Suspense fallback={<ProductQAListSkeleton />}>
        <ProductQAList productId={productId} sellerId={sellerId} />
      </Suspense>
    </section>
  );
}
