"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User, Lock, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  updateProfile,
  changePassword,
  updateNotificationPrefs,
} from "./actions";

// ── Schemas ──────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "Password must be 100 characters or fewer"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Props ────────────────────────────────────────────────────────────

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
  };
  hasPassword: boolean;
  notifications: {
    orderUpdates: boolean;
    shippingUpdates: boolean;
    promotions: boolean;
  };
}

// ── Component ────────────────────────────────────────────────────────

export function SettingsForm({
  user,
  hasPassword,
  notifications,
}: SettingsFormProps): React.ReactElement {
  // ── Profile form ─────────────────────────────────────────────────
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  async function onProfileSubmit(data: ProfileFormData): Promise<void> {
    setIsProfileSaving(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              profileForm.setError(field as keyof ProfileFormData, {
                message: messages[0],
              });
            }
          });
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProfileSaving(false);
    }
  }

  // ── Password form ────────────────────────────────────────────────
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onPasswordSubmit(data: PasswordFormData): Promise<void> {
    setIsPasswordSaving(true);
    try {
      const result = await changePassword(data);
      if (result.success) {
        toast.success(result.message);
        passwordForm.reset();
      } else {
        toast.error(result.message);
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              passwordForm.setError(field as keyof PasswordFormData, {
                message: messages[0],
              });
            }
          });
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  // ── Notification toggles ─────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState(notifications);
  const [isNotifSaving, setIsNotifSaving] = useState(false);

  async function handleNotifToggle(
    key: keyof typeof notifPrefs,
    checked: boolean,
  ): Promise<void> {
    const updated = { ...notifPrefs, [key]: checked };
    setNotifPrefs(updated);
    setIsNotifSaving(true);
    try {
      const result = await updateNotificationPrefs(updated);
      if (result.success) {
        toast.success(result.message);
      } else {
        // Revert on failure
        setNotifPrefs(notifPrefs);
        toast.error(result.message);
      }
    } catch {
      setNotifPrefs(notifPrefs);
      toast.error("Failed to update preferences.");
    } finally {
      setIsNotifSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Personal Information ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>
            Update your name and view your account email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  placeholder="Your full name"
                  {...profileForm.register("name")}
                  aria-invalid={!!profileForm.formState.errors.name}
                  disabled={isProfileSaving}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted text-muted-foreground"
                  aria-describedby="email-readonly-help"
                />
                <p
                  id="email-readonly-help"
                  className="text-xs text-muted-foreground"
                >
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isProfileSaving}
                className="min-w-[140px]"
              >
                {isProfileSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Password Change ──────────────────────────────────────── */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password. You will need to enter your current password
              first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                  aria-invalid={
                    !!passwordForm.formState.errors.currentPassword
                  }
                  disabled={isPasswordSaving}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                    aria-invalid={!!passwordForm.formState.errors.newPassword}
                    disabled={isPasswordSaving}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                    aria-invalid={
                      !!passwordForm.formState.errors.confirmPassword
                    }
                    disabled={isPasswordSaving}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isPasswordSaving}
                  className="min-w-[160px]"
                >
                  {isPasswordSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Notification Preferences ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose which email notifications you would like to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Order Updates */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor="notif-order-updates"
                className="cursor-pointer text-sm font-medium"
              >
                Order Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your order status changes (confirmed,
                processing, etc.).
              </p>
            </div>
            <Switch
              id="notif-order-updates"
              checked={notifPrefs.orderUpdates}
              onCheckedChange={(checked) =>
                handleNotifToggle("orderUpdates", checked)
              }
              disabled={isNotifSaving}
              aria-label="Toggle order update notifications"
            />
          </div>

          <Separator />

          {/* Shipping Updates */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor="notif-shipping-updates"
                className="cursor-pointer text-sm font-medium"
              >
                Shipping Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive tracking updates when your order ships and is out for
                delivery.
              </p>
            </div>
            <Switch
              id="notif-shipping-updates"
              checked={notifPrefs.shippingUpdates}
              onCheckedChange={(checked) =>
                handleNotifToggle("shippingUpdates", checked)
              }
              disabled={isNotifSaving}
              aria-label="Toggle shipping update notifications"
            />
          </div>

          <Separator />

          {/* Promotions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label
                htmlFor="notif-promotions"
                className="cursor-pointer text-sm font-medium"
              >
                Promotions and Deals
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive emails about sales, discounts, and special offers.
              </p>
            </div>
            <Switch
              id="notif-promotions"
              checked={notifPrefs.promotions}
              onCheckedChange={(checked) =>
                handleNotifToggle("promotions", checked)
              }
              disabled={isNotifSaving}
              aria-label="Toggle promotional email notifications"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
