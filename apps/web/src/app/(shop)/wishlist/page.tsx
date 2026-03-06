import type { Metadata } from "next";
import { WishlistContent } from "./wishlist-content";

export const metadata: Metadata = {
  title: "Your Wishlist | Amazone",
  description:
    "View and manage your saved items. Add products to your wishlist and move them to your cart when you are ready to buy.",
};

export default function WishlistPage(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Wishlist</h1>
      <WishlistContent />
    </div>
  );
}
