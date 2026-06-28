import { Info } from "lucide-react";
import { APP_GITHUB_URL } from "@/lib/constants";

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-border bg-primary/10 px-4 py-1.5 text-center text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0 text-primary" />
      <span>
        <strong className="text-foreground">Demo mode</strong> — embedded Postgres + mock billing &
        AI. Add <span className="font-mono">.env</span> credentials to go live.
      </span>
      <a
        href={APP_GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        Docs
      </a>
    </div>
  );
}
