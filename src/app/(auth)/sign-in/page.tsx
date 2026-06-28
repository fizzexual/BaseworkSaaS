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
  title: "Sign in",
  description: "Sign in to your Basework account.",
};

const DEMO_ACCOUNTS = [
  { email: "admin@basework.dev", password: "password123", role: "owner + super-admin" },
  { email: "member@basework.dev", password: "password123", role: "member" },
];

export default function SignInPage() {
  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to continue to your dashboard.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <AuthForm mode="sign-in" />

        {/* Demo accounts */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
          <p className="mb-2 font-medium text-foreground">Demo accounts</p>
          <ul className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex flex-col gap-0.5">
                <span className="font-mono text-foreground">
                  {account.email} · {account.password}
                </span>
                <span className="text-muted-foreground">({account.role})</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.signUp} className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
