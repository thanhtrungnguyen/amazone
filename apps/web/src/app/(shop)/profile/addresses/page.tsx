import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";

import { auth } from "@/lib/auth";
import { getAddresses } from "@amazone/users";
import { AddressList } from "./address-list";

export const metadata: Metadata = {
  title: "My Addresses - Amazone",
  description:
    "Manage your shipping addresses for faster checkout on Amazone.",
};

export default async function AddressesPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const addresses = await getAddresses(session.user.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MapPin className="h-6 w-6" />
          My Addresses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your shipping addresses for faster checkout.
        </p>
      </div>

      <AddressList addresses={addresses} />
    </div>
  );
}
