"use server";

import { db, users } from "@amazone/db";
import { eq } from "drizzle-orm";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "./types.js";

export async function getUserById(
  userId: string
): Promise<typeof users.$inferSelect | undefined> {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function getUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<typeof users.$inferSelect | undefined> {
  const validated = updateProfileSchema.parse(input);

  const [user] = await db
    .update(users)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

export async function createUser(data: {
  name: string;
  email: string;
  hashedPassword: string;
}): Promise<typeof users.$inferSelect> {
  const [user] = await db
    .insert(users)
    .values(data)
    .returning();

  return user;
}
