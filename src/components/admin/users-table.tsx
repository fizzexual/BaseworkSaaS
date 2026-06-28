"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { initials } from "@/lib/utils";

type AdminUser = { id: string; name: string; email: string; role: string; banned: boolean };

export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();

  async function impersonate(userId: string) {
    const { error } = await authClient.admin.impersonateUser({ userId });
    if (error) return toast.error(error.message ?? "Failed to impersonate");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Users · {users.length}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-6 py-3">
            <Avatar className="size-8">
              <AvatarFallback>{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            {u.role === "admin" && <Badge variant="default">admin</Badge>}
            {u.banned && <Badge variant="destructive">banned</Badge>}
            <Button variant="outline" size="sm" onClick={() => impersonate(u.id)}>
              <Eye className="size-3.5" /> Impersonate
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
