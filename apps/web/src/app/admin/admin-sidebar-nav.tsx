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

interface AdminSidebarNavProps {
  pendingReturnsCount: number;
}

export function AdminSidebarNav({
  pendingReturnsCount,
}: AdminSidebarNavProps): React.ReactElement {
  const pathname = usePathname();

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { href: "/admin/users", label: "Users", icon: Users, badge: null },
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
    },
    {
      href: "/admin/coupons",
      label: "Coupons",
      icon: Tag,
      badge: null,
    },
  ] as const;

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin navigation">
      {adminLinks.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

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
                className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-amber-900"
                aria-label={`${link.badge} pending`}
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
