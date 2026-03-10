"use server";

import { db, users } from "@amazone/db";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";

// ─── Types ──────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

const verifyEmailSchema = z.object({
  token: z.string().min(1, "errors.verification.tokenRequired"),
});

// ─── Generate Verification Token ────────────────────────

/**
 * Generates a random verification token and stores it on the user record
 * with a 24-hour expiry. Returns the token for use in email links.
 */
export async function generateVerificationToken(
  userId: string
): Promise<ActionResult<{ token: string }>> {
  try {
    const token = crypto.randomUUID();
    const expiry = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const [updated] = await db
      .update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!updated) {
      return { success: false, error: "errors.verification.userNotFound" };
    }

    return { success: true, data: { token } };
  } catch (err) {
    console.error("[generateVerificationToken] Failed", {
      userId,
      error: err,
    });
    return { success: false, error: "errors.verification.generateFailed" };
  }
}

// ─── Verify Email ───────────────────────────────────────

/**
 * Validates the verification token, marks the user as verified,
 * and clears the token fields.
 */
export async function verifyEmail(
  token: string
): Promise<ActionResult<{ userId: string }>> {
  const parsed = verifyEmailSchema.safeParse({ token });
  if (!parsed.success) {
    return { success: false, error: "errors.verification.invalidToken" };
  }

  try {
    // Find user with this token
    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, parsed.data.token),
      columns: {
        id: true,
        emailVerified: true,
        verificationTokenExpiry: true,
      },
    });

    if (!user) {
      return { success: false, error: "errors.verification.invalidToken" };
    }

    if (user.emailVerified) {
      return { success: false, error: "errors.verification.alreadyVerified" };
    }

    // Check expiry
    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      return { success: false, error: "errors.verification.tokenExpired" };
    }

    // Mark as verified and clear token
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, data: { userId: user.id } };
  } catch (err) {
    console.error("[verifyEmail] Failed", { error: err });
    return { success: false, error: "errors.verification.verifyFailed" };
  }
}

// ─── Resend Verification Token ──────────────────────────

/**
 * Generates a new verification token for a user identified by email.
 * Returns the token and user info needed to send the email.
 * Only works for users who haven't verified yet.
 */
export async function regenerateVerificationToken(
  email: string
): Promise<
  ActionResult<{ token: string; userId: string; name: string; email: string }>
> {
  const emailSchema = z.string().email();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: "errors.verification.invalidEmail" };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, parsed.data),
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return { success: true, data: { token: "", userId: "", name: "", email: "" } };
    }

    if (user.emailVerified) {
      return { success: false, error: "errors.verification.alreadyVerified" };
    }

    const result = await generateVerificationToken(user.id);
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        token: result.data.token,
        userId: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (err) {
    console.error("[regenerateVerificationToken] Failed", {
      email: parsed.data,
      error: err,
    });
    return { success: false, error: "errors.verification.resendFailed" };
  }
}
