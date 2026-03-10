"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addressSchema, type Address } from "@amazone/users";
import { addAddress, editAddress } from "./actions";

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

const LABEL_SUGGESTIONS = ["Home", "Work", "Other"] as const;

interface AddressFormData {
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
  onSuccess: () => void;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSuccess,
}: AddressFormDialogProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!address;

  const form = useForm({
    resolver: zodResolver(
      addressSchema.extend({
        state: addressSchema.shape.state.transform((v) => v ?? ""),
        phone: addressSchema.shape.phone.transform((v) => v ?? ""),
        isDefault: addressSchema.shape.isDefault.transform((v) => v ?? false),
      })
    ),
    defaultValues: {
      label: address?.label ?? "Home",
      fullName: address?.fullName ?? "",
      streetAddress: address?.streetAddress ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      zipCode: address?.zipCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSubmitting(true);
      try {
        const d = data as unknown as AddressFormData;
        const payload = {
          label: d.label,
          fullName: d.fullName,
          streetAddress: d.streetAddress,
          city: d.city,
          state: d.state || null,
          zipCode: d.zipCode,
          country: d.country,
          phone: d.phone || null,
          isDefault: d.isDefault,
        };

        const result = isEditing
          ? await editAddress(address.id, payload)
          : await addAddress(payload);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(
          isEditing
            ? "Address updated successfully."
            : "Address added successfully."
        );
        reset();
        onOpenChange(false);
        onSuccess();
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, address, reset, onOpenChange, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this address."
              : "Add a new shipping address to your account."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="flex flex-col gap-4"
        >
          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-label">
              Label <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {LABEL_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant={
                    form.watch("label") === suggestion ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => form.setValue("label", suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            <Input
              id="address-label"
              placeholder="e.g. Home, Work, Mom's house"
              {...register("label")}
              aria-invalid={!!errors.label}
              aria-describedby={errors.label ? "label-error" : undefined}
              disabled={isSubmitting}
            />
            {errors.label && (
              <p id="label-error" className="text-sm text-destructive">
                {errors.label.message}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address-fullName"
              placeholder="John Doe"
              autoComplete="name"
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Street Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-streetAddress">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address-streetAddress"
              placeholder="123 Main Street, Apt 4"
              autoComplete="street-address"
              {...register("streetAddress")}
              aria-invalid={!!errors.streetAddress}
              disabled={isSubmitting}
            />
            {errors.streetAddress && (
              <p className="text-sm text-destructive">
                {errors.streetAddress.message}
              </p>
            )}
          </div>

          {/* City + State */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address-city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address-city"
                placeholder="New York"
                autoComplete="address-level2"
                {...register("city")}
                aria-invalid={!!errors.city}
                disabled={isSubmitting}
              />
              {errors.city && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address-state">State / Province</Label>
              <Input
                id="address-state"
                placeholder="NY"
                autoComplete="address-level1"
                {...register("state")}
                aria-invalid={!!errors.state}
                disabled={isSubmitting}
              />
              {errors.state && (
                <p className="text-sm text-destructive">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          {/* Country + ZIP */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address-country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="address-country"
                      className="w-full"
                      aria-invalid={!!errors.country}
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
              {errors.country && (
                <p className="text-sm text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address-zipCode">
                ZIP / Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address-zipCode"
                placeholder="10001"
                autoComplete="postal-code"
                {...register("zipCode")}
                aria-invalid={!!errors.zipCode}
                disabled={isSubmitting}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">
                  {errors.zipCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-phone">Phone (optional)</Label>
            <Input
              id="address-phone"
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
              {...register("phone")}
              aria-invalid={!!errors.phone}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Set as Default */}
          <div className="flex items-center gap-2">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="address-isDefault"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
            <Label htmlFor="address-isDefault" className="cursor-pointer">
              Set as default address
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? (
                "Update Address"
              ) : (
                "Add Address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
