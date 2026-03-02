import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Amazone",
  description: "Complete your purchase securely on Amazone.",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
