"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { CartHydrator } from "@/components/cart-hydrator";
import { WishlistHydrator } from "@/components/wishlist-hydrator";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CartHydrator />
        <WishlistHydrator />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
