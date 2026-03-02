"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h2 className="text-2xl font-bold">Dashboard Error</h2>
      <p className="max-w-md text-muted-foreground">
        {error.message || "Failed to load dashboard data. Please try again."}
      </p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
