"use server";

import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken } from "@amazone/users";

export async function sendVerificationForNewUser(params: {
  userId: string;
  email: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await generateVerificationToken(params.userId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    await sendVerificationEmail({
      to: params.email,
      name: params.name,
      token: result.data.token,
    });

    return { success: true };
  } catch (err) {
    console.error("[sendVerificationForNewUser] Failed", {
      userId: params.userId,
      error: err,
    });
    return { success: false, error: "errors.verification.sendFailed" };
  }
}
