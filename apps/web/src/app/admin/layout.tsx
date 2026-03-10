import Link from "next/link";
import { AdminSidebarNav } from "./admin-sidebar-nav";

async function getPendingReturnsCount(): Promise<number> {
  try {
    const { db, returnRequests } = await import("@amazone/db");
    const { sql, eq } = await import("drizzle-orm");

    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(returnRequests)
      .where(eq(returnRequests.status, "pending"));

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getTotalUserCount(): Promise<number> {
  try {
    const { db, users } = await import("@amazone/db");
    const { sql } = await import("drizzle-orm");

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const [pendingReturnsCount, totalUserCount] = await Promise.all([
    getPendingReturnsCount(),
    getTotalUserCount(),
  ]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r bg-gray-900 text-gray-300">
        <div className="border-b border-gray-700 p-4">
          <Link href="/admin" className="text-lg font-bold text-white">
            Admin Panel
          </Link>
        </div>
        <AdminSidebarNav
          pendingReturnsCount={pendingReturnsCount}
          totalUserCount={totalUserCount}
        />
      </aside>

      {/* Content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
