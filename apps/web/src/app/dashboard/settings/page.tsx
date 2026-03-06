import { SellerSettingsForm } from "./seller-settings-form";

export const metadata = {
  title: "Settings -- Amazone Dashboard",
  description: "Manage your seller store settings, payment details, and notification preferences.",
};

export default function SettingsPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <SellerSettingsForm />
      </div>
    </div>
  );
}
