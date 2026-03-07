import type { Metadata } from "next";
import { CartContent } from "./cart-content";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Your Cart | Amazone",
  description:
    "Review the items in your shopping cart. Update quantities, remove items, and proceed to checkout when you are ready.",
};

export default function CartPage(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
      />
      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>
      <CartContent />
    </div>
  );
}
