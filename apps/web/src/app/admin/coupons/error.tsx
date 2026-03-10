"use client";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminCouponsError({
  error,
  reset,
}: ErrorProps): React.ReactElement {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">
        {error.message || "Failed to load coupons. Please try again."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
