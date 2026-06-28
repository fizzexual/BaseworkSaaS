import { type LanguageModel, simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";

/** Pull the last user message text out of the model prompt (best-effort). */
function extractUserText(prompt: unknown): string {
  try {
    const arr = prompt as Array<{
      role: string;
      content: string | Array<{ type: string; text?: string }>;
    }>;
    for (let i = arr.length - 1; i >= 0; i--) {
      const m = arr[i];
      if (m?.role === "user") {
        if (typeof m.content === "string") return m.content;
        return m.content
          .filter((c) => c.type === "text")
          .map((c) => c.text ?? "")
          .join(" ");
      }
    }
  } catch {
    // ignore
  }
  return "";
}

function buildReply(question: string): string {
  const q = question.trim();
  const intro = q
    ? `Here's a quick take on "${q.length > 80 ? `${q.slice(0, 80)}…` : q}":`
    : "Hi — I'm the Basework demo assistant.";
  return (
    `${intro}\n\n` +
    "This reply comes from the **built-in mock AI provider** — no API key needed. " +
    "Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to switch to a real model; every token " +
    "is then metered against your org's **usage credits** and billed as Stripe usage on overage.\n\n" +
    "What you're seeing exercised right now:\n\n" +
    "- Real streaming via the Vercel AI SDK\n" +
    "- Per-org **credit deduction** on each message\n" +
    "- Multi-tenant isolation + fine-grained RBAC\n\n" +
    "Ask me anything else to watch the credit balance tick down."
  );
}

/**
 * A deterministic, dependency-free streaming model used in zero-config dev so
 * the AI chat works with no provider key. Streams word-by-word like a real LLM.
 */
export function createMockModel(): LanguageModel {
  return new MockLanguageModelV3({
    modelId: "mock:basework-1",
    doStream: async ({ prompt }) => {
      const userText = extractUserText(prompt);
      const text = buildReply(userText);
      const id = "0";
      const chunks: any[] = [
        { type: "text-start", id },
        ...text.split(/(\s+)/).map((delta) => ({ type: "text-delta", id, delta })),
        { type: "text-end", id },
        {
          type: "finish",
          finishReason: "stop",
          usage: {
            inputTokens: Math.max(1, Math.ceil(userText.length / 4)),
            outputTokens: Math.ceil(text.length / 4),
            totalTokens: Math.ceil((userText.length + text.length) / 4),
          },
        },
      ];
      return {
        stream: simulateReadableStream({ chunks, initialDelayInMs: 120, chunkDelayInMs: 12 }),
      };
    },
  }) as unknown as LanguageModel;
}
