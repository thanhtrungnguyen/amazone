"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const signUpSchema = z.object({
  name: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpData = z.infer<typeof signUpSchema>;

export function SignUpForm(): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(data: SignUpData) {
    setError(null);

    try {
      // Hash password and create user via server action
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const { createUser, getUserByEmail } = await import("@amazone/users");

      // Check if user already exists
      const existing = await getUserByEmail(data.email);
      if (existing) {
        setError("An account with this email already exists.");
        return;
      }

      await createUser({
        name: data.name,
        email: data.email,
        hashedPassword,
      });

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Failed to create account. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register("name")}
          aria-invalid={!!errors.name}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          {...register("password")}
          aria-invalid={!!errors.password}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
