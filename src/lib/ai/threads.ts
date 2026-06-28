import { asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { type AiMessage, type AiThread, aiMessages, aiThreads } from "@/lib/db/schema";
import { deriveTitle } from "./prompt";

export async function listThreads(organizationId: string): Promise<AiThread[]> {
  return db
    .select()
    .from(aiThreads)
    .where(eq(aiThreads.organizationId, organizationId))
    .orderBy(desc(aiThreads.updatedAt))
    .limit(50);
}

export async function getThreadMessages(threadId: string): Promise<AiMessage[]> {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.threadId, threadId))
    .orderBy(asc(aiMessages.createdAt));
}

export async function createThread(params: {
  organizationId: string;
  userId: string;
  title: string;
}): Promise<string> {
  const id = nanoid();
  await db.insert(aiThreads).values({
    id,
    organizationId: params.organizationId,
    userId: params.userId,
    title: deriveTitle(params.title),
  });
  return id;
}

/** Insert a thread with a caller-provided id if it doesn't already exist. */
export async function ensureThread(params: {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
}): Promise<string> {
  await db
    .insert(aiThreads)
    .values({
      id: params.id,
      organizationId: params.organizationId,
      userId: params.userId,
      title: deriveTitle(params.title),
    })
    .onConflictDoNothing();
  return params.id;
}

export async function appendMessage(params: {
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<void> {
  await db.insert(aiMessages).values({
    id: nanoid(),
    threadId: params.threadId,
    role: params.role,
    content: params.content,
    model: params.model,
    inputTokens: params.inputTokens ?? 0,
    outputTokens: params.outputTokens ?? 0,
  });
  await db
    .update(aiThreads)
    .set({ updatedAt: new Date() })
    .where(eq(aiThreads.id, params.threadId));
}
