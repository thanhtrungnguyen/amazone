"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

const sellerSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required").max(100),
  storeDescription: z.string().max(1000).optional(),
  contactEmail: z.string().email("Invalid email address"),
  payoutSchedule: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  notifyNewOrder: z.boolean(),
  notifyLowStock: z.boolean(),
  notifyReviewReceived: z.boolean(),
});

type SellerSettingsData = z.infer<typeof sellerSettingsSchema>;

export function SellerSettingsForm(): React.ReactElement {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SellerSettingsData>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: {
      storeName: "My Amazone Store",
      storeDescription:
        "We sell high-quality electronics and accessories at competitive prices.",
      contactEmail: "seller@example.com",
      payoutSchedule: "weekly",
      notifyNewOrder: true,
      notifyLowStock: true,
      notifyReviewReceived: false,
    },
  });

  async function onSubmit(_data: SellerSettingsData): Promise<void> {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSaving(false);
    toast.success("Settings saved", {
      description: "Your seller settings have been updated.",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Information</CardTitle>
          <CardDescription>
            Basic details about your seller store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store Name</Label>
            <Input
              id="store-name"
              placeholder="Enter your store name"
              {...register("storeName")}
              aria-invalid={!!errors.storeName}
            />
            {errors.storeName && (
              <p className="text-sm text-destructive">{errors.storeName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-description">Store Description</Label>
            <Textarea
              id="store-description"
              placeholder="Describe your store and what you sell"
              rows={4}
              {...register("storeDescription")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="seller@example.com"
              {...register("contactEmail")}
              aria-invalid={!!errors.contactEmail}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Settings</CardTitle>
          <CardDescription>
            Manage your payout preferences and bank details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account</Label>
            <Input
              id="bank-account"
              value="**** **** **** 4829"
              disabled
              aria-describedby="bank-account-hint"
            />
            <p id="bank-account-hint" className="text-xs text-muted-foreground">
              Contact support to update your bank account details.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="payout-schedule">Payout Schedule</Label>
            <Controller
              control={control}
              name="payoutSchedule"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="payout-schedule" className="w-full max-w-xs">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
          <CardDescription>
            Choose which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={control}
            name="notifyNewOrder"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-new-order"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div>
                  <Label htmlFor="notify-new-order" className="cursor-pointer">
                    New Order
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when a customer places an order
                  </p>
                </div>
              </div>
            )}
          />

          <Separator />

          <Controller
            control={control}
            name="notifyLowStock"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-low-stock"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div>
                  <Label htmlFor="notify-low-stock" className="cursor-pointer">
                    Low Stock Alert
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when product inventory drops below threshold
                  </p>
                </div>
              </div>
            )}
          />

          <Separator />

          <Controller
            control={control}
            name="notifyReviewReceived"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-review"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div>
                  <Label htmlFor="notify-review" className="cursor-pointer">
                    Review Received
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when a customer leaves a product review
                  </p>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
