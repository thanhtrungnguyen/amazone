"use server";

import { getUserByEmail } from "@amazone/users";

/**
 * Checks whether the given email belongs to an unverified user.
 * Returns true if the user exists, has a password (credentials user),
 * and has not yet verified their email.
 *
 * This is called before signIn on the client so we can redirect
 * to the verification page with a helpful message.
 */
export async function checkEmailVerificationStatus(
  email: string
): Promise<{ needsVerification: boolean }> {
  try {
    const user = await getUserByEmail(email);
    if (user && user.hashedPassword && !user.emailVerified) {
      return { needsVerification: true };
    }
    return { needsVerification: false };
  } catch {
    // If the check fails, allow the sign-in flow to proceed normally
    return { needsVerification: false };
  }
}
