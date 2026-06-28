import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start building your SaaS with Basework — no credit card required.",
};

export default function SignUpPage() {
  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start building in seconds — no credit card.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* After sign-up the user has no organization yet; /dashboard handles onboarding. */}
        <AuthForm mode="sign-up" />
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to the demo terms.
        </p>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={ROUTES.signIn} className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
