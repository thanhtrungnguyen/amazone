import Link from "next/link";
import { AdminSidebarNav } from "./admin-sidebar-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r bg-gray-900 text-gray-300">
        <div className="border-b border-gray-700 p-4">
          <Link href="/admin" className="text-lg font-bold text-white">
            Admin Panel
          </Link>
        </div>
        <AdminSidebarNav />
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
