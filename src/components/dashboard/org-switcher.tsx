"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { cn, initials } from "@/lib/utils";

interface OrgSwitcherProps {
  activeOrg: { id: string; name: string; slug: string; plan: string };
  memberships: { id: string; name: string; slug: string; role: string }[];
}

export function OrgSwitcher({ activeOrg, memberships }: OrgSwitcherProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(orgId: string) {
    if (orgId === activeOrg.id) return;
    setPending(true);
    const { error } = await authClient.organization.setActive({ organizationId: orgId });
    setPending(false);
    if (error) return toast.error(error.message ?? "Failed to switch organization");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/40 px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-accent/50 disabled:opacity-60"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand text-xs font-semibold text-white">
          {initials(activeOrg.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{activeOrg.name}</span>
          <span className="block truncate text-xs capitalize text-muted-foreground">
            {activeOrg.plan} plan
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {memberships.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => switchTo(m.id)}>
            <span className="grid size-6 place-items-center rounded bg-secondary text-[10px] font-semibold">
              {initials(m.name)}
            </span>
            <span className="flex-1 truncate">{m.name}</span>
            <Check className={cn("size-4", m.id === activeOrg.id ? "opacity-100" : "opacity-0")} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          <Plus className="size-4" />
          New organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
