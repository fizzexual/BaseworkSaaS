"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Send, Square, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const SUGGESTIONS = [
  "What can Basework do?",
  "Explain the AI credit metering",
  "How does multi-tenancy work here?",
];

export function Chat({
  threadId,
  initialMessages = [],
}: {
  threadId?: string;
  initialMessages?: UIMessage[];
}) {
  const [chatId] = useState(
    () => threadId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `t_${Date.now()}`),
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat", body: { threadId: chatId } }),
    [chatId],
  );
  const { messages, sendMessage, status, error, setMessages, stop } = useChat({ transport });

  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && initialMessages.length) setMessages(initialMessages);
    seeded.current = true;
  }, [initialMessages, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-sm space-y-4">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand">
                <Bot className="size-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Basework Assistant</p>
                <p className="text-sm text-muted-foreground">
                  Streaming replies, metered per message against your AI credits.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg",
                  m.role === "user" ? "bg-secondary" : "bg-brand",
                )}
              >
                {m.role === "user" ? (
                  <User className="size-4" />
                ) : (
                  <Bot className="size-4 text-white" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "bg-secondary" : "border border-border bg-background/40",
                )}
              >
                {messageText(m) || (busy ? "…" : "")}
              </div>
            </div>
          ))
        )}
        {error && (
          <p className="text-center text-xs text-destructive">
            Something went wrong — you may be out of AI credits. Check Billing to upgrade.
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {busy ? (
          <Button type="button" size="icon" variant="secondary" onClick={() => stop()}>
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" variant="brand" disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
