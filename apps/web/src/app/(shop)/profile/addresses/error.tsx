"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AddressesError({
  reset,
}: ErrorBoundaryProps): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h2 className="text-lg font-semibold">
            Failed to load addresses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong while loading your addresses. Please try again.
          </p>
        </div>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
