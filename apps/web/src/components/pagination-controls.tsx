"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaginationControlsProps {
  hasMore: boolean;
  lastCursor: string;
}

export function PaginationControls({
  hasMore,
  lastCursor,
}: PaginationControlsProps): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (!hasMore) {
    return null;
  }

  function handleLoadMore(): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cursor", lastCursor);
    startTransition(() => {
      router.push(`/products?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="mt-8 flex justify-center">
      <Button
        variant="outline"
        size="lg"
        onClick={handleLoadMore}
        disabled={isPending}
        className="min-w-[200px]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Load more products"
        )}
      </Button>
    </div>
  );
}
