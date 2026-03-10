"use server";

import { sendVerificationEmail } from "@/lib/email";
import { regenerateVerificationToken } from "@amazone/users";

export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await regenerateVerificationToken(email);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // If the user was not found, we still return success to avoid
    // leaking whether the email exists (token will be empty string)
    if (!result.data.token) {
      return { success: true };
    }

    await sendVerificationEmail({
      to: result.data.email,
      name: result.data.name,
      token: result.data.token,
    });

    return { success: true };
  } catch (err) {
    console.error("[resendVerificationEmail] Failed", { email, error: err });
    return { success: false, error: "errors.verification.resendFailed" };
  }
}
