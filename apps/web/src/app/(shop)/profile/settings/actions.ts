"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db, users } from "@amazone/db";
import { eq } from "drizzle-orm";

// ── Schemas ──────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "Password must be 100 characters or fewer"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const notificationPrefsSchema = z.object({
  orderUpdates: z.boolean(),
  shippingUpdates: z.boolean(),
  promotions: z.boolean(),
});

// ── Result type ──────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

// ── Actions ──────────────────────────────────────────────────────────

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "You must be signed in." };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    await db
      .update(users)
      .set({
        name: parsed.data.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true, message: "Profile updated successfully." };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

export async function changePassword(
  input: z.infer<typeof changePasswordSchema>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "You must be signed in." };
    }

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    // Fetch current user to verify existing password
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return {
        success: false,
        message:
          "Password change is not available for accounts that use social login.",
      };
    }

    const isCurrentValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.hashedPassword,
    );

    if (!isCurrentValid) {
      return {
        success: false,
        message: "Current password is incorrect.",
        errors: { currentPassword: ["Current password is incorrect."] },
      };
    }

    const hashedNewPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    await db
      .update(users)
      .set({
        hashedPassword: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true, message: "Password changed successfully." };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

export async function updateNotificationPrefs(
  input: z.infer<typeof notificationPrefsSchema>,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "You must be signed in." };
    }

    const parsed = notificationPrefsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    await db
      .update(users)
      .set({
        notificationPreferences: parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return {
      success: true,
      message: "Notification preferences updated successfully.",
    };
  } catch {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
