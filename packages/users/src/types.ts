import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
