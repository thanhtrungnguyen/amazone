import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getUserById } from "@amazone/users";

import { SettingsForm } from "./settings-form";

// ── Metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Account Settings — Amazone",
  description:
    "Manage your profile information, password, and notification preferences on Amazone.",
};

// ── Default notification preferences ─────────────────────────────────

const DEFAULT_NOTIFICATION_PREFS = {
  orderUpdates: true,
  shippingUpdates: true,
  promotions: false,
} as const;

// ── Page component ───────────────────────────────────────────────────

export default async function ProfileSettingsPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    redirect("/sign-in");
  }

  const hasPassword = !!user.hashedPassword;

  const notifications = user.notificationPreferences
    ? {
        orderUpdates: user.notificationPreferences.orderUpdates ?? DEFAULT_NOTIFICATION_PREFS.orderUpdates,
        shippingUpdates: user.notificationPreferences.shippingUpdates ?? DEFAULT_NOTIFICATION_PREFS.shippingUpdates,
        promotions: user.notificationPreferences.promotions ?? DEFAULT_NOTIFICATION_PREFS.promotions,
      }
    : { ...DEFAULT_NOTIFICATION_PREFS };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, security, and notification preferences
          </p>
        </div>
      </div>

      {/* Settings form (client component) */}
      <SettingsForm
        user={{
          name: user.name,
          email: user.email,
        }}
        hasPassword={hasPassword}
        notifications={notifications}
      />
    </div>
  );
}
