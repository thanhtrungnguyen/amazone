"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useForm,
  Controller,
  type UseFormRegister,
  type FieldErrors,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShoppingCart,
  Truck,
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ClipboardList,
  CreditCard,
  Check,
  MapPin,
  Tag,
  X,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@amazone/shared-utils";
import { EmptyState } from "@amazone/shared-ui";
import type { Address } from "@amazone/users";
import { submitCheckout, validateCouponCode, saveCheckoutAddress } from "./actions";
import { AddressSelector } from "./address-selector";
import type { ApplyCouponResult } from "@amazone/checkout";

// ─── Constants ──────────────────────────────────────────

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "VN", name: "Vietnam" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "NZ", name: "New Zealand" },
] as const;

const STEPS = [
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "review", label: "Review", icon: ClipboardList },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Coupon state ────────────────────────────────────────

interface AppliedCoupon {
  code: string;
  discountCents: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

// ─── Validation Schema ──────────────────────────────────

const shippingSchema = z.object({
  shippingName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Name is too long"),
  shippingAddress: z
    .string()
    .min(1, "Street address is required")
    .max(500, "Address is too long"),
  shippingCity: z
    .string()
    .min(1, "City is required")
    .max(255, "City name is too long"),
  shippingState: z.string().max(255, "State is too long").optional(),
  shippingCountry: z
    .string()
    .length(2, "Please select a country"),
  shippingZip: z
    .string()
    .min(1, "ZIP / postal code is required")
    .max(20, "ZIP code is too long"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

// ─── Step Progress Indicator ────────────────────────────

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
}): React.ReactElement {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index < currentIndex;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex items-center">
              {index > 0 && (
                <div
                  className={`hidden h-0.5 w-8 sm:block sm:w-12 md:w-20 ${
                    isCompleted
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
                      : "cursor-default bg-muted text-muted-foreground"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Coupon Input ────────────────────────────────────────

function CouponInput({
  subtotalCents,
  appliedCoupon,
  onApply,
  onRemove,
  disabled,
}: {
  subtotalCents: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  disabled: boolean;
}): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleApply = useCallback(async () => {
    const code = inputValue.trim();
    if (!code) return;

    setIsApplying(true);
    setCouponError(null);

    try {
      const result: ApplyCouponResult = await validateCouponCode(
        code,
        subtotalCents
      );

      if (result.valid) {
        onApply({
          code: result.code,
          discountCents: result.discountCents,
          discountType: result.discountType,
          discountValue: result.discountValue,
        });
        setInputValue("");
        setCouponError(null);
      } else {
        setCouponError(result.error);
      }
    } catch {
      setCouponError("Unable to validate coupon. Please try again.");
    } finally {
      setIsApplying(false);
    }
  }, [inputValue, subtotalCents, onApply]);

  const handleRemove = useCallback(() => {
    onRemove();
    setCouponError(null);
    setInputValue("");
    // Return focus to the input for keyboard users
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onRemove]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleApply();
      }
    },
    [handleApply]
  );

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              {appliedCoupon.code}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {appliedCoupon.discountType === "percentage"
                ? `${appliedCoupon.discountValue}% off`
                : `${formatPrice(appliedCoupon.discountValue)} off`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-green-400 dark:hover:bg-green-900"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value.toUpperCase());
            if (couponError) setCouponError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Coupon code"
          maxLength={50}
          disabled={disabled || isApplying}
          aria-label="Coupon code"
          aria-describedby={couponError ? "coupon-error" : undefined}
          aria-invalid={!!couponError}
          className={couponError ? "border-destructive" : ""}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleApply()}
          disabled={!inputValue.trim() || disabled || isApplying}
          className="shrink-0"
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {couponError && (
        <p id="coupon-error" className="text-xs text-destructive" role="alert">
          {couponError}
        </p>
      )}
    </div>
  );
}

// ─── Order Summary Sidebar ──────────────────────────────

function OrderSummary({
  isSubmitting,
  currentStep,
  onNext,
  onSubmit,
  appliedCoupon,
  onCouponApply,
  onCouponRemove,
}: {
  isSubmitting: boolean;
  currentStep: StepId;
  onNext: () => void;
  onSubmit: () => void;
  appliedCoupon: AppliedCoupon | null;
  onCouponApply: (coupon: AppliedCoupon) => void;
  onCouponRemove: () => void;
}): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());

  const finalTotal = Math.max(
    0,
    totalPrice - (appliedCoupon?.discountCents ?? 0)
  );

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({totalItems}{" "}
              {totalItems === 1 ? "item" : "items"})
            </span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-green-600 dark:text-green-400">Free</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-muted-foreground">Calculated at payment</span>
          </div>

          {/* Discount line — only shown when a coupon is applied */}
          {appliedCoupon && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                Discount ({appliedCoupon.code})
              </span>
              <span className="text-green-600 dark:text-green-400">
                -{formatPrice(appliedCoupon.discountCents)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between font-bold">
            <span>Estimated Total</span>
            <span className="text-lg">{formatPrice(finalTotal)}</span>
          </div>
        </div>

        {/* Coupon input — only shown on review step */}
        {currentStep === "review" && (
          <div className="mt-4">
            <p className="mb-1.5 text-sm font-medium">Have a coupon?</p>
            <CouponInput
              subtotalCents={totalPrice}
              appliedCoupon={appliedCoupon}
              onApply={onCouponApply}
              onRemove={onCouponRemove}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Compact item list */}
        <div className="mt-4 max-h-48 overflow-y-auto">
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded border bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                    </div>
                  )}
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                  <p className="truncate text-xs">{item.name}</p>
                  <p className="flex-shrink-0 text-xs font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {currentStep === "shipping" && (
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={onNext}
          >
            <span className="flex items-center gap-2">
              Continue to Review
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        )}

        {currentStep === "review" && (
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={onSubmit}
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
                Place Order and Pay
              </span>
            )}
          </Button>
        )}

        {currentStep === "payment" && (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to payment...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Place Order and Pay
              </span>
            )}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {currentStep === "shipping"
            ? "Review your order on the next step."
            : "You will be redirected to Stripe for secure payment."}
        </p>
      </CardFooter>
    </Card>
  );
}

// ─── Shipping Address Step ──────────────────────────────

function ShippingStep({
  register,
  errors,
  control,
  isSubmitting,
  onSelectSavedAddress,
  saveAddress,
  onSaveAddressChange,
}: {
  register: UseFormRegister<ShippingFormData>;
  errors: FieldErrors<ShippingFormData>;
  control: Control<ShippingFormData>;
  isSubmitting: boolean;
  onSelectSavedAddress: (address: Address) => void;
  saveAddress: boolean;
  onSaveAddressChange: (checked: boolean) => void;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Address
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the address where you want your order delivered.
        </p>
      </CardHeader>
      <CardContent>
        <AddressSelector
          onSelect={onSelectSavedAddress}
          disabled={isSubmitting}
        />
        <div className="grid gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="shippingName"
              className="text-sm font-medium"
            >
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="shippingName"
              placeholder="John Doe"
              autoComplete="name"
              {...register("shippingName")}
              aria-invalid={!!errors.shippingName}
              aria-describedby={
                errors.shippingName ? "shippingName-error" : undefined
              }
              disabled={isSubmitting}
            />
            {errors.shippingName && (
              <p id="shippingName-error" className="text-sm text-destructive">
                {errors.shippingName.message}
              </p>
            )}
          </div>

          {/* Street Address */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="shippingAddress"
              className="text-sm font-medium"
            >
              Street Address <span className="text-destructive">*</span>
            </label>
            <Input
              id="shippingAddress"
              placeholder="123 Main Street, Apt 4"
              autoComplete="street-address"
              {...register("shippingAddress")}
              aria-invalid={!!errors.shippingAddress}
              aria-describedby={
                errors.shippingAddress ? "shippingAddress-error" : undefined
              }
              disabled={isSubmitting}
            />
            {errors.shippingAddress && (
              <p
                id="shippingAddress-error"
                className="text-sm text-destructive"
              >
                {errors.shippingAddress.message}
              </p>
            )}
          </div>

          {/* City + State row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="shippingCity"
                className="text-sm font-medium"
              >
                City <span className="text-destructive">*</span>
              </label>
              <Input
                id="shippingCity"
                placeholder="New York"
                autoComplete="address-level2"
                {...register("shippingCity")}
                aria-invalid={!!errors.shippingCity}
                aria-describedby={
                  errors.shippingCity ? "shippingCity-error" : undefined
                }
                disabled={isSubmitting}
              />
              {errors.shippingCity && (
                <p
                  id="shippingCity-error"
                  className="text-sm text-destructive"
                >
                  {errors.shippingCity.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="shippingState"
                className="text-sm font-medium"
              >
                State / Province
              </label>
              <Input
                id="shippingState"
                placeholder="NY"
                autoComplete="address-level1"
                {...register("shippingState")}
                aria-invalid={!!errors.shippingState}
                aria-describedby={
                  errors.shippingState ? "shippingState-error" : undefined
                }
                disabled={isSubmitting}
              />
              {errors.shippingState && (
                <p
                  id="shippingState-error"
                  className="text-sm text-destructive"
                >
                  {errors.shippingState.message}
                </p>
              )}
            </div>
          </div>

          {/* Country + ZIP row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="shippingCountry"
                className="text-sm font-medium"
              >
                Country <span className="text-destructive">*</span>
              </label>
              <Controller
                name="shippingCountry"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="shippingCountry"
                      className="w-full"
                      aria-invalid={!!errors.shippingCountry}
                      aria-describedby={
                        errors.shippingCountry
                          ? "shippingCountry-error"
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.shippingCountry && (
                <p
                  id="shippingCountry-error"
                  className="text-sm text-destructive"
                >
                  {errors.shippingCountry.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="shippingZip"
                className="text-sm font-medium"
              >
                ZIP / Postal Code <span className="text-destructive">*</span>
              </label>
              <Input
                id="shippingZip"
                placeholder="10001"
                autoComplete="postal-code"
                {...register("shippingZip")}
                aria-invalid={!!errors.shippingZip}
                aria-describedby={
                  errors.shippingZip ? "shippingZip-error" : undefined
                }
                disabled={isSubmitting}
              />
              {errors.shippingZip && (
                <p
                  id="shippingZip-error"
                  className="text-sm text-destructive"
                >
                  {errors.shippingZip.message}
                </p>
              )}
            </div>
          </div>

          {/* Save this address checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="save-address-checkbox"
              checked={saveAddress}
              onCheckedChange={(checked) =>
                onSaveAddressChange(checked === true)
              }
              disabled={isSubmitting}
            />
            <label
              htmlFor="save-address-checkbox"
              className="cursor-pointer text-sm"
            >
              Save this address for future orders
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Review Step ────────────────────────────────────────

function ReviewStep({
  formData,
  onEditAddress,
}: {
  formData: ShippingFormData;
  onEditAddress: () => void;
}): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice());

  const countryName =
    COUNTRIES.find((c) => c.code === formData.shippingCountry)?.name ??
    formData.shippingCountry;

  return (
    <div className="flex flex-col gap-6">
      {/* Shipping Address Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditAddress}
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="font-medium">{formData.shippingName}</p>
            <p className="text-sm text-muted-foreground">
              {formData.shippingAddress}
            </p>
            <p className="text-sm text-muted-foreground">
              {formData.shippingCity}
              {formData.shippingState ? `, ${formData.shippingState}` : ""}{" "}
              {formData.shippingZip}
            </p>
            <p className="text-sm text-muted-foreground">{countryName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Items Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <span className="font-medium">Order Total</span>
            <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Checkout Form ─────────────────────────────────

export function CheckoutForm(): React.ReactElement {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>("shipping");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      shippingName: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingCountry: "",
      shippingZip: "",
    },
    mode: "onBlur",
  });

  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const handleSelectSavedAddress = useCallback(
    (address: Address) => {
      setValue("shippingName", address.fullName);
      setValue("shippingAddress", address.streetAddress);
      setValue("shippingCity", address.city);
      setValue("shippingState", address.state ?? "");
      setValue("shippingCountry", address.country);
      setValue("shippingZip", address.zipCode);
      // No need to save an address that's already saved
      setSaveAddress(false);
    },
    [setValue]
  );

  const goToStep = useCallback((step: StepId) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNextToReview = useCallback(async () => {
    const isValid = await trigger();
    if (isValid) {
      goToStep("review");
    }
  }, [trigger, goToStep]);

  const handlePlaceOrder = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) {
      goToStep("shipping");
      return;
    }

    setIsSubmitting(true);
    goToStep("payment");

    try {
      const data = getValues();
      const payload: ShippingFormData & { couponCode?: string } = {
        ...data,
        shippingState: data.shippingState || undefined,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      };

      // Save address if checkbox was checked (fire and forget -- don't block checkout)
      if (saveAddress) {
        void saveCheckoutAddress({
          label: "Home",
          fullName: data.shippingName,
          streetAddress: data.shippingAddress,
          city: data.shippingCity,
          state: data.shippingState || null,
          zipCode: data.shippingZip,
          country: data.shippingCountry,
          phone: null,
          isDefault: false,
        });
      }

      const response = await submitCheckout(payload);

      if (!response.success) {
        toast.error(response.error);
        goToStep("review");
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
      goToStep("review");
    } finally {
      setIsSubmitting(false);
    }
  }, [trigger, getValues, clearCart, goToStep, appliedCoupon, saveAddress]);

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
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cart" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-6 text-muted-foreground">
        Complete your order in a few simple steps.
      </p>

      <StepIndicator currentStep={currentStep} onStepClick={goToStep} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content -- spans 2 columns */}
        <div className="lg:col-span-2">
          {currentStep === "shipping" && (
            <ShippingStep
              register={register}
              errors={errors}
              control={control}
              isSubmitting={isSubmitting}
              onSelectSavedAddress={handleSelectSavedAddress}
              saveAddress={saveAddress}
              onSaveAddressChange={setSaveAddress}
            />
          )}

          {currentStep === "review" && (
            <ReviewStep
              formData={getValues()}
              onEditAddress={() => goToStep("shipping")}
            />
          )}

          {currentStep === "payment" && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">
                  Preparing your secure payment...
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  You will be redirected to Stripe momentarily.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step Navigation (mobile-friendly, shown below content) */}
          <div className="mt-6 flex items-center justify-between lg:hidden">
            {currentStep !== "shipping" && currentStep !== "payment" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => goToStep("shipping")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep === "shipping" && (
              <>
                <div />
                <Button type="button" onClick={() => void handleNextToReview()}>
                  Continue to Review
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {currentStep === "review" && (
              <Button
                type="button"
                onClick={() => void handlePlaceOrder()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Place Order and Pay
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary
            isSubmitting={isSubmitting}
            currentStep={currentStep}
            onNext={() => void handleNextToReview()}
            onSubmit={() => void handlePlaceOrder()}
            appliedCoupon={appliedCoupon}
            onCouponApply={setAppliedCoupon}
            onCouponRemove={() => setAppliedCoupon(null)}
          />
        </div>
      </div>

      {/* Security assurance bar */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-lg border bg-muted/30 px-6 py-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          SSL Encrypted
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Secure Payment via Stripe
        </span>
        <span className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Free Shipping
        </span>
      </div>
    </div>
  );
}
