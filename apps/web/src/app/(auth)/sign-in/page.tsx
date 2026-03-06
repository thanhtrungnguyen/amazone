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
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign In — Amazone",
};

export default function SignInPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 text-2xl font-bold">
          amazone
        </Link>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
      <Separator />
      <CardFooter className="justify-center pt-6">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-foreground">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
