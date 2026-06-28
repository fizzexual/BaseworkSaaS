"use client";

import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeByoKey, saveByoKey, updateOrganizationName } from "@/server/actions/settings";

export function SettingsForms({
  orgName,
  byoKey,
  canManageOrg,
  canManageKeys,
}: {
  orgName: string;
  byoKey: { provider: string; last4: string } | null;
  canManageOrg: boolean;
  canManageKeys: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [provider, setProvider] = useState<"openai" | "anthropic">("anthropic");
  const [key, setKey] = useState("");
  const [pending, start] = useTransition();

  function saveName() {
    start(async () => {
      try {
        await updateOrganizationName(name);
        toast.success("Organization updated");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function saveKey() {
    if (key.length < 8) return toast.error("Enter a valid API key");
    start(async () => {
      try {
        await saveByoKey(provider, key);
        toast.success("API key saved & encrypted");
        setKey("");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function removeKey() {
    start(async () => {
      await removeByoKey();
      toast.success("API key removed");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization and AI providers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Your workspace's display name.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManageOrg}
            />
          </div>
          <Button onClick={saveName} disabled={!canManageOrg || pending || name === orgName}>
            {pending && <Loader2 className="size-4 animate-spin" />} Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Bring your own AI key
          </CardTitle>
          <CardDescription>
            Stored encrypted (AES-256-GCM). When set, AI calls use your key and skip credit
            metering.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {byoKey ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="success" className="capitalize">
                  {byoKey.provider}
                </Badge>
                <span className="font-mono text-muted-foreground">••••{byoKey.last4}</span>
              </div>
              {canManageKeys && (
                <Button variant="ghost" size="sm" onClick={removeKey} disabled={pending}>
                  <Trash2 className="size-4" /> Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as "openai" | "anthropic")}
                  disabled={!canManageKeys}
                  className="h-10 rounded-lg border border-input bg-background/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="api-key">API key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  disabled={!canManageKeys}
                />
              </div>
              <Button onClick={saveKey} disabled={!canManageKeys || pending}>
                {pending && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
