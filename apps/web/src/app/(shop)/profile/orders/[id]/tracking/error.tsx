"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function TrackingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold">Failed to load tracking info</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        We encountered an error loading the tracking information for this order.
        Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
