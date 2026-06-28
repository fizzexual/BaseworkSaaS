"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { adminToggleFlag } from "@/server/actions/admin";

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    start(async () => {
      try {
        await adminToggleFlag(flagKey, next);
        toast.success(`${flagKey} ${next ? "enabled" : "disabled"}`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return <Switch checked={enabled} onCheckedChange={toggle} disabled={pending} />;
}
