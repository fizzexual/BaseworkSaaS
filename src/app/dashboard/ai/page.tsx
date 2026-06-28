import type { UIMessage } from "ai";
import Link from "next/link";
import { Chat } from "@/components/dashboard/chat";
import { getThreadMessages, listThreads } from "@/lib/ai/threads";
import { cn } from "@/lib/utils";
import { requireActiveOrg } from "@/server/context";

export const metadata = { title: "AI Assistant" };

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const ctx = await requireActiveOrg();
  const { thread } = await searchParams;
  const threads = await listThreads(ctx.activeOrg.id);
  const activeThreadId = thread && threads.some((t) => t.id === thread) ? thread : undefined;
  const history = activeThreadId ? await getThreadMessages(activeThreadId) : [];
  const initialMessages: UIMessage[] = history.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  }));

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-6xl gap-4">
      <aside className="hidden w-64 shrink-0 flex-col rounded-xl border border-border bg-card lg:flex">
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="text-sm font-medium">Conversations</span>
          <Link href="/dashboard/ai" className="text-xs font-medium text-primary hover:underline">
            + New
          </Link>
        </div>
        <div className="flex-1 space-y-1 overflow-auto p-2">
          {threads.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/ai?thread=${t.id}`}
                className={cn(
                  "block truncate rounded-lg px-3 py-2 text-sm transition-colors",
                  t.id === activeThreadId
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {t.title}
              </Link>
            ))
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Chat
          key={activeThreadId ?? "new"}
          threadId={activeThreadId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
