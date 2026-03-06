import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Settings — Amazone",
  description: "Manage your profile, shipping address, and notification preferences.",
};

// ── Placeholder data ────────────────────────────────────────────────

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

const placeholderSettings: UserSettings = {
  user: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
  },
  address: {
    street: "742 Evergreen Terrace",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    country: "United States",
  },
  notifications: {
    orderUpdates: true,
    promotions: false,
    reviews: true,
  },
};

// ── Data fetching with fallback ─────────────────────────────────────

async function getSettings(): Promise<UserSettings> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return placeholderSettings;
    }

    // Query the real user record for additional stored data
    const { getUserById } = await import("@amazone/users");
    const user = await getUserById(session.user.id);

    return {
      ...placeholderSettings,
      user: {
        name: user?.name ?? session.user.name ?? "User",
        email: user?.email ?? session.user.email ?? "",
      },
      // Address fields are not yet stored in the users table,
      // so we keep the placeholder defaults until the schema is extended.
    };
  } catch {
    return placeholderSettings;
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
