"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/client";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

/** GitHub mark — lucide v1 dropped brand glyphs, so we inline the official SVG. */
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-4" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/** Google "G" mark — lucide has no brand glyph, so we inline the official SVG. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (isSignUp && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

      if (error) {
        toast.error(error.message ?? "Something went wrong. Please try again.");
        return;
      }

      toast.success(isSignUp ? "Account created. Welcome aboard!" : "Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSocial(provider: "github" | "google") {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (error) {
        toast.error(error.message ?? "Could not start social sign-in.");
        setLoading(false);
      }
      // On success the client performs a full-page redirect to the provider,
      // so we intentionally leave `loading` set to keep the buttons disabled.
    } catch {
      toast.error("Could not start social sign-in.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Social providers */}
      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => onSocial("github")}
        >
          <GithubIcon />
          Continue with GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => onSocial("google")}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Email form */}
      <form onSubmit={onSubmit} className="grid gap-4">
        {isSignUp && (
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
            minLength={isSignUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {isSignUp && (
            <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
          )}
        </div>

        <Button type="submit" variant="brand" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
