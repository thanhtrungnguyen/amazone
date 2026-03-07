import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Checkout — Amazone",
  description: "Complete your purchase securely on Amazone.",
};

export default function CheckoutPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />
      </div>
      <CheckoutForm />
    </>
  );
}
