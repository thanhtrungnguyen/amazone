"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => /^[A-Z0-9_-]+$/.test(v), {
      message: "Code may only contain letters, numbers, hyphens, and underscores",
    }),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().int().positive("Discount value must be positive"),
  minOrderCents: z.number().int().nonnegative().nullable(),
  maxUsages: z.number().int().positive().nullable(),
  expiresAt: z.date().nullable(),
});

type CouponInput = z.infer<typeof couponSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createCoupon(data: CouponInput): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = couponSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  // Extra validation: percentage cannot exceed 100
  if (parsed.data.discountType === "percentage" && parsed.data.discountValue > 100) {
    return { success: false, error: "Percentage discount cannot exceed 100" };
  }

  try {
    const { db, coupons } = await import("@amazone/db");

    await db.insert(coupons).values({
      code: parsed.data.code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minOrderCents: parsed.data.minOrderCents,
      maxUsages: parsed.data.maxUsages,
      expiresAt: parsed.data.expiresAt,
    });

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) {
      return { success: false, error: "A coupon with this code already exists" };
    }
    return { success: false, error: "Failed to create coupon" };
  }
}

export async function updateCoupon(
  id: string,
  data: CouponInput
): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = couponSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.discountType === "percentage" && parsed.data.discountValue > 100) {
    return { success: false, error: "Percentage discount cannot exceed 100" };
  }

  try {
    const { db, coupons } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    await db
      .update(coupons)
      .set({
        code: parsed.data.code,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        minOrderCents: parsed.data.minOrderCents,
        maxUsages: parsed.data.maxUsages,
        expiresAt: parsed.data.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id));

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique")) {
      return { success: false, error: "A coupon with this code already exists" };
    }
    return { success: false, error: "Failed to update coupon" };
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { db, coupons } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    // Fetch the coupon to check usageCount
    const [coupon] = await db
      .select({ usageCount: coupons.usageCount })
      .from(coupons)
      .where(eq(coupons.id, id));

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    if (coupon.usageCount > 0) {
      // Deactivate instead of deleting — preserve history
      await db
        .update(coupons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(coupons.id, id));

      revalidatePath("/admin/coupons");
      return {
        success: true,
        error: "Coupon has been used and was deactivated instead of deleted",
      };
    }

    await db.delete(coupons).where(eq(coupons.id, id));

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete coupon" };
  }
}

export async function toggleCouponActive(id: string): Promise<ActionResult> {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { db, coupons } = await import("@amazone/db");
    const { eq, not } = await import("drizzle-orm");

    await db
      .update(coupons)
      .set({ isActive: not(coupons.isActive), updatedAt: new Date() })
      .where(eq(coupons.id, id));

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to toggle coupon status" };
  }
}
