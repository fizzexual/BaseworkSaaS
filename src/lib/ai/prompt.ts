import type { UIMessage } from "ai";

export const SYSTEM_PROMPT =
  "You are Basework Assistant, a helpful AI built into the Basework SaaS starter. " +
  "Be concise, accurate and developer-friendly. Format answers in markdown.";

/** Concatenate the text parts of a UI message. */
export function uiMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Text of the most recent user message in a thread. */
export function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return last ? uiMessageText(last) : "";
}

/** A short, clean thread title derived from the first prompt. */
export function deriveTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "New chat";
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}
