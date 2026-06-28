"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "org"}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setLoading(true);
    const { data, error } = await authClient.organization.create({
      name: name.trim(),
      slug: slugify(name),
    });
    if (error || !data) {
      setLoading(false);
      return toast.error(error?.message ?? "Could not create organization");
    }
    await authClient.organization.setActive({ organizationId: data.id });
    toast.success("Workspace created");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background grid-bg p-6">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96" />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-brand">
            <Sparkles className="size-5 text-white" />
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>
            Organizations are how Basework does multi-tenancy. You can invite your team and create
            more later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc"
                autoFocus
                required
              />
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
