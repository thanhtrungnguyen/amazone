"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  Heart,
  Star,
  MapPin,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const profileLinks = [
  { href: "/profile", label: "Profile", icon: User, exact: true },
  { href: "/profile/orders", label: "Orders", icon: Package, exact: false },
  { href: "/wishlist", label: "Wishlist", icon: Heart, exact: false },
  { href: "/profile/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/profile/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function ProfileSidebarNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden flex-col gap-1 md:flex"
        aria-label="Profile navigation"
      >
        {profileLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile horizontal tabs */}
      <nav
        className="flex gap-1 overflow-x-auto border-b pb-2 md:hidden"
        aria-label="Profile navigation"
      >
        {profileLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
