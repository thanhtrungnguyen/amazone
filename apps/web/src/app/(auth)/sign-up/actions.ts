"use server";

import { sendWelcomeEmail } from "@/lib/email";

export async function sendWelcome(params: {
  to: string;
  name: string;
}): Promise<void> {
  try {
    await sendWelcomeEmail(params);
  } catch {
    // Fire-and-forget — don't fail signup if email is down
    console.warn("[email] Failed to send welcome email to", params.to);
  }
}
