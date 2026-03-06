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
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign Up — Amazone",
};

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <Link href="/" className="mb-2 text-2xl font-bold">
          amazone
        </Link>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start shopping or selling on Amazone
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <Separator />
      <CardFooter className="justify-center pt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-foreground">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
