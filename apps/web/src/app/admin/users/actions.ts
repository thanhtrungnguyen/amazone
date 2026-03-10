"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@amazone/shared-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const VALID_ROLES = ["customer", "seller", "admin"] as const;
type UserRole = (typeof VALID_ROLES)[number];

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  isBanned: boolean;
  joinedDate: string;
  orderCount: number;
  totalSpentCents: number;
}

export interface GetAdminUsersParams {
  search?: string;
  role?: string;
  page?: number;
}

export interface GetAdminUsersResult {
  users: AdminUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// getAdminUsers — paginated user list with order stats
// ---------------------------------------------------------------------------

export async function getAdminUsers(
  params: GetAdminUsersParams
): Promise<GetAdminUsersResult> {
  const { search, role, page = 1 } = params;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const { db, users, orders } = await import("@amazone/db");
    const { sql, desc, eq, ilike, or, and } = await import("drizzle-orm");

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (role && VALID_ROLES.includes(role as UserRole)) {
      conditions.push(eq(users.role, role as UserRole));
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(ilike(users.name, term), ilike(users.email, term))!
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Count total matching users
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);
    const totalCount = countRow?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    // Fetch paginated users with order stats
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        orderCount: sql<number>`count(${orders.id})::int`,
        totalSpentCents: sql<number>`coalesce(sum(${orders.totalInCents}), 0)::int`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .where(whereClause)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return {
      users: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        image: row.image,
        role: row.role as UserRole,
        isBanned: row.isBanned,
        joinedDate: row.createdAt.toISOString().slice(0, 10),
        orderCount: row.orderCount,
        totalSpentCents: row.totalSpentCents,
      })),
      totalCount,
      totalPages,
      currentPage: page,
    };
  } catch (err) {
    logger.error({ err }, "getAdminUsers failed");
    return { users: [], totalCount: 0, totalPages: 1, currentPage: 1 };
  }
}

// ---------------------------------------------------------------------------
// getUserCount — total user count for sidebar badge
// ---------------------------------------------------------------------------

export async function getUserCount(): Promise<number> {
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

// ---------------------------------------------------------------------------
// updateUserRole
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  role: string
): Promise<ActionResult> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  if (!VALID_ROLES.includes(role as UserRole)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    const { db, users } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(users)
      .set({ role: role as UserRole, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    logger.error({ err, userId, role }, "updateUserRole failed");
    return { success: false, error: "Failed to update user role" };
  }
}

// ---------------------------------------------------------------------------
// banUser
// ---------------------------------------------------------------------------

export async function banUser(userId: string): Promise<ActionResult> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const { db, users } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    // Prevent banning other admins
    const [target] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!target) return { success: false, error: "User not found" };
    if (target.role === "admin") {
      return { success: false, error: "Cannot ban an admin user" };
    }

    await db
      .update(users)
      .set({ isBanned: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    logger.error({ err, userId }, "banUser failed");
    return { success: false, error: "Failed to ban user" };
  }
}

// ---------------------------------------------------------------------------
// unbanUser
// ---------------------------------------------------------------------------

export async function unbanUser(userId: string): Promise<ActionResult> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const { db, users } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(users)
      .set({ isBanned: false, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    logger.error({ err, userId }, "unbanUser failed");
    return { success: false, error: "Failed to unban user" };
  }
}
