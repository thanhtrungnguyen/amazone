"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CheckoutErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({
  error,
  reset,
}: CheckoutErrorProps): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Checkout Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Something went wrong during checkout. No payment has been charged.
          </p>
          {error.message && (
            <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/cart" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Return to Cart
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
