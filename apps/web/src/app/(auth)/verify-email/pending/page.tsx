import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import { ResendVerificationForm } from "./resend-form";

export const metadata = {
  title: "Verify Your Email — Amazone",
};

interface PendingPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPendingPage({
  searchParams,
}: PendingPageProps) {
  const { email } = await searchParams;

  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 text-2xl font-bold">
          amazone
        </Link>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Mail className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        {email && (
          <p className="mb-4 text-sm font-medium text-foreground">{email}</p>
        )}
        <p className="mb-2 text-sm text-muted-foreground">
          Click the link in the email to verify your account. The link will
          expire in 24 hours.
        </p>
        <p className="text-sm text-muted-foreground">
          If you don&apos;t see the email, check your spam folder.
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col gap-4 pt-6">
        <ResendVerificationForm defaultEmail={email ?? ""} />
        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/sign-in" className="font-medium text-foreground">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
