"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function ImpersonationBanner({ userName }: { userName: string }) {
  const router = useRouter();

  async function stop() {
    await authClient.admin.stopImpersonating();
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-warning/15 px-4 py-1.5 text-center text-xs text-warning">
      <Eye className="size-3.5" />
      <span>
        Impersonating <strong>{userName}</strong>
      </span>
      <button
        type="button"
        onClick={stop}
        className="rounded-md bg-warning/20 px-2 py-0.5 font-medium text-warning hover:bg-warning/30"
      >
        Stop
      </button>
    </div>
  );
}
