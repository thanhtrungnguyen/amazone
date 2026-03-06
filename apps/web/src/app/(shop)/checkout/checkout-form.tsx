"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, Truck, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@amazone/shared-utils";
import { EmptyState } from "@amazone/shared-ui";
import { submitCheckout } from "./actions";

const shippingSchema = z.object({
  shippingName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Name is too long"),
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z
    .string()
    .min(1, "City is required")
    .max(255, "City name is too long"),
  shippingCountry: z
    .string()
    .length(2, "Country code must be 2 characters (e.g., US)"),
  shippingZip: z
    .string()
    .min(1, "ZIP / postal code is required")
    .max(20, "ZIP code is too long"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export function CheckoutForm(): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      shippingName: "",
      shippingAddress: "",
      shippingCity: "",
      shippingCountry: "",
      shippingZip: "",
    },
  });

  async function onSubmit(data: ShippingFormData): Promise<void> {
    setIsSubmitting(true);

    try {
      const response = await submitCheckout(data);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      clearCart();
      window.location.href = response.data.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Your cart is empty"
          description="Add some products to your cart before checking out."
          action={
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Shipping Address Form -- spans 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="shippingName"
                      className="text-sm font-medium"
                    >
                      Full Name
                    </label>
                    <Input
                      id="shippingName"
                      placeholder="John Doe"
                      {...register("shippingName")}
                      aria-invalid={!!errors.shippingName}
                      disabled={isSubmitting}
                    />
                    {errors.shippingName && (
                      <p className="text-sm text-destructive">
                        {errors.shippingName.message}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="shippingAddress"
                      className="text-sm font-medium"
                    >
                      Street Address
                    </label>
                    <Input
                      id="shippingAddress"
                      placeholder="123 Main Street, Apt 4"
                      {...register("shippingAddress")}
                      aria-invalid={!!errors.shippingAddress}
                      disabled={isSubmitting}
                    />
                    {errors.shippingAddress && (
                      <p className="text-sm text-destructive">
                        {errors.shippingAddress.message}
                      </p>
                    )}
                  </div>

                  {/* City + Country row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="shippingCity"
                        className="text-sm font-medium"
                      >
                        City
                      </label>
                      <Input
                        id="shippingCity"
                        placeholder="New York"
                        {...register("shippingCity")}
                        aria-invalid={!!errors.shippingCity}
                        disabled={isSubmitting}
                      />
                      {errors.shippingCity && (
                        <p className="text-sm text-destructive">
                          {errors.shippingCity.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="shippingCountry"
                        className="text-sm font-medium"
                      >
                        Country Code
                      </label>
                      <Input
                        id="shippingCountry"
                        placeholder="US"
                        maxLength={2}
                        {...register("shippingCountry", {
                          setValueAs: (v: string) => v.toUpperCase(),
                        })}
                        aria-invalid={!!errors.shippingCountry}
                        disabled={isSubmitting}
                      />
                      {errors.shippingCountry && (
                        <p className="text-sm text-destructive">
                          {errors.shippingCountry.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ZIP Code */}
                  <div className="flex flex-col gap-1.5 sm:max-w-[200px]">
                    <label
                      htmlFor="shippingZip"
                      className="text-sm font-medium"
                    >
                      ZIP / Postal Code
                    </label>
                    <Input
                      id="shippingZip"
                      placeholder="10001"
                      {...register("shippingZip")}
                      aria-invalid={!!errors.shippingZip}
                      disabled={isSubmitting}
                    />
                    {errors.shippingZip && (
                      <p className="text-sm text-destructive">
                        {errors.shippingZip.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items Review */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ShoppingCart className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal ({items.length}{" "}
                      {items.length === 1 ? "item" : "items"})
                    </span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting to payment...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Proceed to Payment
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You will be redirected to Stripe for secure payment processing.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
