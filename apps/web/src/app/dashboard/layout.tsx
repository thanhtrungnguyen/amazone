import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/components/layout/cart-drawer";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 border-r bg-gray-50/50 md:block">
          <nav className="flex flex-col gap-1 p-4">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CartDrawer />
    </div>
  );
}
