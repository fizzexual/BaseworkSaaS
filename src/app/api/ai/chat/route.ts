import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { nanoid } from "nanoid";
import { getActiveByoKey } from "@/lib/ai/byo";
import { OutOfCreditsError, precheck, recordUsage } from "@/lib/ai/metering";
import { lastUserText, SYSTEM_PROMPT, uiMessageText } from "@/lib/ai/prompt";
import { resolveModel } from "@/lib/ai/providers";
import { appendMessage, ensureThread } from "@/lib/ai/threads";
import { getBillingSummary } from "@/lib/billing/subscriptions";
import { scopedLogger } from "@/lib/observability/logger";
import { requireActiveOrg } from "@/server/context";

export const maxDuration = 60;

const log = scopedLogger("ai:chat");

export async function POST(req: Request) {
  let ctx: Awaited<ReturnType<typeof requireActiveOrg>>;
  try {
    ctx = await requireActiveOrg();
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { messages?: UIMessage[]; threadId?: string };
  const messages = body.messages ?? [];
  const org = ctx.activeOrg;

  const byo = await getActiveByoKey(org.id);
  const summary = await getBillingSummary(org.id);

  try {
    await precheck({ organizationId: org.id, plan: summary.plan, byo: !!byo });
  } catch (err) {
    if (err instanceof OutOfCreditsError) {
      return Response.json({ error: "out_of_credits" }, { status: 402 });
    }
    throw err;
  }

  const threadId = body.threadId ?? nanoid();
  await ensureThread({
    id: threadId,
    organizationId: org.id,
    userId: ctx.user.id,
    title: lastUserText(messages),
  });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await appendMessage({ threadId, role: "user", content: uiMessageText(lastMessage) });
  }

  const resolved = resolveModel(byo ? { byoKey: byo } : undefined);
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: resolved.model,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    onFinish: async ({ usage, text }) => {
      const inputTokens = usage?.inputTokens ?? 0;
      const outputTokens = usage?.outputTokens ?? Math.ceil((text?.length ?? 0) / 4);
      try {
        await appendMessage({
          threadId,
          role: "assistant",
          content: text ?? "",
          model: resolved.modelId,
          inputTokens,
          outputTokens,
        });
        await recordUsage({
          organizationId: org.id,
          userId: ctx.user.id,
          plan: summary.plan,
          model: resolved.modelId,
          inputTokens,
          outputTokens,
          threadId,
          byo: !!byo,
          customerId: org.stripeCustomerId,
        });
      } catch (err) {
        log.error({ err }, "failed to persist/meter assistant message");
      }
    },
  });

  return result.toUIMessageStreamResponse({ headers: { "x-thread-id": threadId } });
}
