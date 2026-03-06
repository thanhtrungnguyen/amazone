import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { DashboardSidebarNav } from "./dashboard-sidebar-nav";

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
          <DashboardSidebarNav />
        </aside>
        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CartDrawer />
    </div>
  );
}
