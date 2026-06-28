import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { aiMode, env } from "@/lib/env";
import { createMockModel } from "./mock-model";

export type AiProviderId = "mock" | "anthropic" | "openai";

export interface ResolvedModel {
  model: LanguageModel;
  modelId: string;
  provider: AiProviderId;
}

export interface ByoKey {
  provider: "openai" | "anthropic";
  key: string;
}

const DEFAULT_ANTHROPIC = "claude-3-5-sonnet-latest";
const DEFAULT_OPENAI = "gpt-4o-mini";

/**
 * Resolve the language model to use for a request.
 * Precedence: BYO org key → configured live provider → built-in mock.
 */
export function resolveModel(opts?: { byoKey?: ByoKey }): ResolvedModel {
  if (opts?.byoKey) {
    if (opts.byoKey.provider === "anthropic") {
      const id = parseModelId("anthropic") ?? DEFAULT_ANTHROPIC;
      return {
        model: createAnthropic({ apiKey: opts.byoKey.key })(id),
        modelId: id,
        provider: "anthropic",
      };
    }
    const id = parseModelId("openai") ?? DEFAULT_OPENAI;
    return {
      model: createOpenAI({ apiKey: opts.byoKey.key })(id),
      modelId: id,
      provider: "openai",
    };
  }

  if (aiMode === "mock") {
    return { model: createMockModel(), modelId: "mock:basework-1", provider: "mock" };
  }

  const [provider] = (env.AI_DEFAULT_MODEL ?? "").split(":");
  if (env.ANTHROPIC_API_KEY && (provider === "anthropic" || !env.OPENAI_API_KEY)) {
    const id = parseModelId("anthropic") ?? DEFAULT_ANTHROPIC;
    return {
      model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(id),
      modelId: id,
      provider: "anthropic",
    };
  }
  const id = parseModelId("openai") ?? DEFAULT_OPENAI;
  return {
    model: createOpenAI({ apiKey: env.OPENAI_API_KEY })(id),
    modelId: id,
    provider: "openai",
  };
}

/** Extract "model" from an AI_DEFAULT_MODEL of the form "provider:model". */
function parseModelId(forProvider: AiProviderId): string | undefined {
  const raw = env.AI_DEFAULT_MODEL;
  if (!raw) return undefined;
  const [provider, ...rest] = raw.split(":");
  if (provider !== forProvider) return undefined;
  const id = rest.join(":");
  return id || undefined;
}
