import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { verifyEmail } from "@amazone/users";

export const metadata = {
  title: "Verify Email — Amazone",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 text-2xl font-bold">
            amazone
          </Link>
          <CardTitle className="text-xl">Invalid Verification Link</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-muted-foreground">
            The verification link is missing the required token. Please check
            your email and try clicking the link again.
          </p>
        </CardContent>
        <Separator />
        <CardFooter className="justify-center pt-6">
          <Link href="/verify-email/pending">
            <Button variant="outline">Resend Verification Email</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const result = await verifyEmail(token);

  if (result.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 text-2xl font-bold">
            amazone
          </Link>
          <CardTitle className="text-xl">Email Verified</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <p className="mb-4 text-muted-foreground">
            Your email has been successfully verified. You can now sign in to
            your account.
          </p>
          <Link href="/sign-in">
            <Button className="w-full">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Handle specific error cases
  const isExpired = result.error === "errors.verification.tokenExpired";
  const isAlreadyVerified =
    result.error === "errors.verification.alreadyVerified";

  if (isAlreadyVerified) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 text-2xl font-bold">
            amazone
          </Link>
          <CardTitle className="text-xl">Already Verified</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <p className="mb-4 text-muted-foreground">
            Your email address has already been verified. You can sign in to
            your account.
          </p>
          <Link href="/sign-in">
            <Button className="w-full">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 text-2xl font-bold">
            amazone
          </Link>
          <CardTitle className="text-xl">Link Expired</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <p className="mb-4 text-muted-foreground">
            This verification link has expired. Please request a new
            verification email.
          </p>
        </CardContent>
        <Separator />
        <CardFooter className="justify-center pt-6">
          <Link href="/verify-email/pending">
            <Button variant="outline">Resend Verification Email</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Generic error
  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 text-2xl font-bold">
          amazone
        </Link>
        <CardTitle className="text-xl">Verification Failed</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <p className="mb-4 text-muted-foreground">
          We could not verify your email. The link may be invalid or has already
          been used.
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="justify-center pt-6">
        <Link href="/verify-email/pending">
          <Button variant="outline">Resend Verification Email</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
