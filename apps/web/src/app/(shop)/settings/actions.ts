"use server";

import { auth } from "@/lib/auth";

interface FormState {
  message: string;
  success: boolean;
}

export async function saveSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        message: "You must be signed in to update settings.",
        success: false,
      };
    }

    const name = formData.get("name");

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        message: "Name is required.",
        success: false,
      };
    }

    const { updateProfile } = await import("@amazone/users");

    await updateProfile(session.user.id, { name: name.trim() });

    // Address fields are read from the form but not yet persisted
    // (the users table does not have address columns).
    // const street = formData.get("street");
    // const city = formData.get("city");
    // const state = formData.get("state");
    // const zip = formData.get("zip");
    // const country = formData.get("country");

    return {
      message: "Settings saved successfully.",
      success: true,
    };
  } catch {
    return {
      message: "Something went wrong. Please try again.",
      success: false,
    };
  }
}
