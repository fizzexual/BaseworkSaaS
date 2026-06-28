"use client";

import { Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { initials } from "@/lib/utils";

type Member = { id: string; name: string; email: string; role: string; isSelf: boolean };
type Invite = { id: string; email: string; role: string };

const ROLE_VARIANT: Record<string, "brand" | "default" | "secondary"> = {
  owner: "brand",
  admin: "default",
  member: "secondary",
};

export function MembersManager({
  members,
  invitations,
  canManage,
  canRemove,
}: {
  members: Member[];
  invitations: Invite[];
  canManage: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [busy, setBusy] = useState(false);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await authClient.organization.inviteMember({ email: email.trim(), role });
    setBusy(false);
    if (error) return toast.error(error.message ?? "Failed to send invitation");
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
    setOpen(false);
    router.refresh();
  }

  async function remove(memberId: string) {
    const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId });
    if (error) return toast.error(error.message ?? "Failed to remove member");
    toast.success("Member removed");
    router.refresh();
  }

  async function cancelInvite(invitationId: string) {
    const { error } = await authClient.organization.cancelInvitation({ invitationId });
    if (error) return toast.error(error.message ?? "Failed to cancel invitation");
    toast.success("Invitation canceled");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Invite teammates and manage their roles.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="brand" size="sm">
                <UserPlus className="size-4" /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a member</DialogTitle>
                <DialogDescription>
                  They'll receive an email with a link to join this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "member" | "admin")}
                    className="h-10 w-full rounded-lg border border-input bg-background/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="brand" onClick={invite} disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />} Send invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team · {members.length}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-6 py-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name} {m.isSelf && <span className="text-muted-foreground">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <Badge variant={ROLE_VARIANT[m.role] ?? "secondary"} className="capitalize">
                {m.role}
              </Badge>
              {canRemove && !m.isSelf && m.role !== "owner" && (
                <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invitations · {invitations.length}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {invitations.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">{i.role}</p>
                </div>
                <Badge variant="outline">Pending</Badge>
                {canManage && (
                  <Button variant="ghost" size="icon" onClick={() => cancelInvite(i.id)}>
                    <X className="size-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
