"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { resendVerificationEmail } from "./actions";

const resendSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ResendData = z.infer<typeof resendSchema>;

interface ResendVerificationFormProps {
  defaultEmail: string;
}

export function ResendVerificationForm({
  defaultEmail,
}: ResendVerificationFormProps): React.ReactElement {
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendData>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: defaultEmail },
  });

  async function onSubmit(data: ResendData) {
    setStatus("sending");
    setErrorMessage(null);

    try {
      const result = await resendVerificationEmail(data.email);

      if (!result.success) {
        if (result.error === "errors.verification.alreadyVerified") {
          setErrorMessage(
            "This email is already verified. Please sign in instead."
          );
          setStatus("error");
          return;
        }
        setErrorMessage(
          "Failed to resend verification email. Please try again."
        );
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="w-full rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-800"
        role="status"
      >
        Verification email sent! Please check your inbox.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
          disabled={status === "sending"}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={status === "sending"}
          size="sm"
          className="shrink-0"
        >
          {status === "sending" && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Resend
        </Button>
      </div>
      {errors.email && (
        <p className="text-sm text-destructive">{errors.email.message}</p>
      )}
      {errorMessage && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </form>
  );
}
