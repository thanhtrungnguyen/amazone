import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Settings — Amazone",
  description: "Manage your profile, shipping address, and notification preferences.",
};

interface UserSettings {
  user: { name: string; email: string };
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

const defaultAddress = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

const defaultNotifications = {
  orderUpdates: true,
  promotions: false,
  reviews: true,
};

async function getSettings(): Promise<UserSettings> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return {
        user: { name: "", email: "" },
        address: defaultAddress,
        notifications: defaultNotifications,
      };
    }

    const { getUserById } = await import("@amazone/users");
    const user = await getUserById(session.user.id);

    const prefs = (user as Record<string, unknown>)?.notificationPreferences as
      | { orderUpdates?: boolean; promotions?: boolean }
      | undefined;

    return {
      user: {
        name: user?.name ?? session.user.name ?? "",
        email: user?.email ?? session.user.email ?? "",
      },
      address: defaultAddress,
      notifications: {
        orderUpdates: prefs?.orderUpdates ?? true,
        promotions: prefs?.promotions ?? false,
        reviews: true,
      },
    };
  } catch {
    return {
      user: { name: "", email: "" },
      address: defaultAddress,
      notifications: defaultNotifications,
    };
  }
}

// ── Page component ──────────────────────────────────────────────────

export default async function SettingsPage() {
  const settings = await getSettings();

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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account preferences
          </p>
        </div>
      </div>

      {/* Settings form (client component for interactivity) */}
      <SettingsForm
        user={settings.user}
        address={settings.address}
        notifications={settings.notifications}
      />
    </div>
  );
}
