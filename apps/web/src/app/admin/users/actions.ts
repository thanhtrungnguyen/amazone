"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const VALID_ROLES = ["customer", "seller", "admin"] as const;
type UserRole = (typeof VALID_ROLES)[number];

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

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
  } catch {
    return { success: false, error: "Failed to update user role" };
  }
}
