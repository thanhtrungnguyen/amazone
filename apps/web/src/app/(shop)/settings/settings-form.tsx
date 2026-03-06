"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, Bell } from "lucide-react";
import { saveSettings } from "./actions";

// ── Types ───────────────────────────────────────────────────────────

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    reviews: boolean;
  };
}

// ── Component ───────────────────────────────────────────────────────

export function SettingsForm({ user, address, notifications }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveSettings, {
    message: "",
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Profile section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Your account details. Contact support to change your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Your full name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                disabled
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Shipping Address</CardTitle>
          </div>
          <CardDescription>
            Default address used for deliveries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              name="street"
              defaultValue={address.street}
              placeholder="123 Main St, Apt 4B"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={address.city}
                placeholder="City"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                name="state"
                defaultValue={address.state}
                placeholder="State"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="zip">ZIP / Postal Code</Label>
              <Input
                id="zip"
                name="zip"
                defaultValue={address.zip}
                placeholder="10001"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={address.country}
                placeholder="United States"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose what email notifications you receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="orderUpdates"
              name="orderUpdates"
              defaultChecked={notifications.orderUpdates}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="orderUpdates" className="cursor-pointer">
                Order Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified about order status changes, shipping, and delivery.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Checkbox
              id="promotions"
              name="promotions"
              defaultChecked={notifications.promotions}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="promotions" className="cursor-pointer">
                Promotions & Deals
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive emails about sales, discounts, and special offers.
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Checkbox
              id="reviews"
              name="reviews"
              defaultChecked={notifications.reviews}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="reviews" className="cursor-pointer">
                Review Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get reminded to review products you have purchased.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback message */}
      {state.message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
