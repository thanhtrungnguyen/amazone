"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FolderTree,
  RotateCcw,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeVariant = "amber" | "neutral";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
  badgeVariant?: BadgeVariant;
  badgeAriaLabel?: string;
}

interface AdminSidebarNavProps {
  pendingReturnsCount: number;
  totalUserCount: number;
}

const badgeStyles: Record<BadgeVariant, string> = {
  amber:
    "bg-amber-400 px-1.5 text-xs font-semibold text-amber-900",
  neutral:
    "bg-gray-600 px-1.5 text-xs font-semibold text-gray-200",
};

export function AdminSidebarNav({
  pendingReturnsCount,
  totalUserCount,
}: AdminSidebarNavProps): React.ReactElement {
  const pathname = usePathname();

  const adminLinks: NavLink[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      badge: totalUserCount > 0 ? totalUserCount : null,
      badgeVariant: "neutral",
      badgeAriaLabel: `${totalUserCount} total users`,
    },
    { href: "/admin/products", label: "Products", icon: Package, badge: null },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: FolderTree,
      badge: null,
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ShoppingCart,
      badge: null,
    },
    {
      href: "/admin/returns",
      label: "Returns",
      icon: RotateCcw,
      badge: pendingReturnsCount > 0 ? pendingReturnsCount : null,
      badgeVariant: "amber",
      badgeAriaLabel: `${pendingReturnsCount} pending`,
    },
    {
      href: "/admin/coupons",
      label: "Coupons",
      icon: Tag,
      badge: null,
    },
  ];

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin navigation">
      {adminLinks.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        const variant = link.badgeVariant ?? "amber";

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{link.label}</span>
            {link.badge !== null && (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full",
                  badgeStyles[variant]
                )}
                aria-label={link.badgeAriaLabel ?? `${link.badge}`}
              >
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
