import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Order Confirmed -- Amazone",
  description: "Your order has been placed successfully.",
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const orderId = params.order_id;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your purchase! Your order has been placed successfully
            and is being processed.
          </p>

          {orderId && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono text-sm font-semibold">{orderId}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly with your order
            details and tracking information.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          {orderId && (
            <Button asChild className="w-full">
              <Link
                href={`/profile/orders/${orderId}`}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                View Order Details
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
