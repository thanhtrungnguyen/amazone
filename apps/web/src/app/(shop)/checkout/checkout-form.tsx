"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ShoppingCart, Truck, Lock, ArrowLeft } from "lucide-react";
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

const shippingFormSchema = z.object({
  shippingName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Name is too long"),
  shippingAddress: z
    .string()
    .min(1, "Address is required"),
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

type ShippingFormData = z.infer<typeof shippingFormSchema>;

type FieldErrors = Partial<Record<keyof ShippingFormData, string>>;

export function CheckoutForm(): React.ReactElement {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState<ShippingFormData>({
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCountry: "",
    shippingZip: "",
  });

  function updateField(field: keyof ShippingFormData, value: string): void {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setFieldErrors({});

    const result = shippingFormSchema.safeParse(formData);

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ShippingFormData;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Stub action: simulate order placement
      // When Stripe keys are configured, this will call createCheckoutSession
      // and redirect to Stripe Checkout. For now, we show a success toast.
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      toast.success("Order placed successfully! Thank you for your purchase.");
      clearCart();
      router.push("/");
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

      <form onSubmit={handleSubmit}>
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
                      value={formData.shippingName}
                      onChange={(e) =>
                        updateField("shippingName", e.target.value)
                      }
                      aria-invalid={!!fieldErrors.shippingName}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.shippingName && (
                      <p className="text-sm text-destructive">
                        {fieldErrors.shippingName}
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
                      value={formData.shippingAddress}
                      onChange={(e) =>
                        updateField("shippingAddress", e.target.value)
                      }
                      aria-invalid={!!fieldErrors.shippingAddress}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.shippingAddress && (
                      <p className="text-sm text-destructive">
                        {fieldErrors.shippingAddress}
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
                        value={formData.shippingCity}
                        onChange={(e) =>
                          updateField("shippingCity", e.target.value)
                        }
                        aria-invalid={!!fieldErrors.shippingCity}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.shippingCity && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.shippingCity}
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
                        value={formData.shippingCountry}
                        onChange={(e) =>
                          updateField(
                            "shippingCountry",
                            e.target.value.toUpperCase()
                          )
                        }
                        aria-invalid={!!fieldErrors.shippingCountry}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.shippingCountry && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.shippingCountry}
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
                      value={formData.shippingZip}
                      onChange={(e) =>
                        updateField("shippingZip", e.target.value)
                      }
                      aria-invalid={!!fieldErrors.shippingZip}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.shippingZip && (
                      <p className="text-sm text-destructive">
                        {fieldErrors.shippingZip}
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
                      {/* Item image */}
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

                      {/* Item details */}
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
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Place Order
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By placing your order, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
