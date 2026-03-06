import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Checkout Cancelled -- Amazone",
  description: "Your checkout session was cancelled.",
};

export default function CheckoutCancelPage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <XCircle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Checkout Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your checkout session was cancelled. No payment has been charged.
            Your items are still saved in your cart.
          </p>
          <p className="text-sm text-muted-foreground">
            If you experienced any issues during checkout, please contact our
            support team for assistance.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button asChild className="w-full">
            <Link href="/checkout" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Try Checkout Again
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
