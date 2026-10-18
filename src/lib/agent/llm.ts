import ZAI from "z-ai-web-dev-sdk";

/**
 * askLLM — provider-chain wrapper (deploy pass).
 *
 * Order (first that is configured AND succeeds wins):
 *  1. OpenRouter    — OPENROUTER_API_KEY (+ optional LLM_MODEL)
 *  2. DashScope     — DASHSCOPE_API_KEY (international Model Studio,
 *                    OpenAI-compatible endpoint; DASHSCOPE_LLM_MODEL,
 *                    default qwen-plus; DASHSCOPE_BASE_URL override)
 *  3. z-ai sandbox  — z-ai-web-dev-sdk via the sandbox gateway
 *                    (.z-ai-config; local/dev only — the gateway is private
 *                    and unreachable from public hosting)
 *
 * A failing provider falls through to the next instead of failing the turn
 * (e.g. an out-of-credit OpenRouter key transparently degrades to DashScope).
 */

const DEFAULT_DASHSCOPE_BASE = "https://dashscope-intl.aliyuncs.com";
const DEFAULT_DASHSCOPE_MODEL = "qwen-plus";
const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";

function dashscopeBase(): string {
  return (
    process.env.DASHSCOPE_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_DASHSCOPE_BASE
  );
}

function extractContent(data: unknown): string | null {
  const content = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return content.trim();
}

async function askOpenRouter(system: string, user: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? DEFAULT_OPENROUTER_MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(`openrouter: ${message}`);
  }
  const content = extractContent(data);
  if (!content) throw new Error("openrouter: empty response");
  return content;
}

async function askDashScope(system: string, user: string): Promise<string> {
  const res = await fetch(
    `${dashscopeBase()}/compatible-mode/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_LLM_MODEL ?? DEFAULT_DASHSCOPE_MODEL,
        max_tokens: 2048,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    }
  );
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(`dashscope: ${message}`);
  }
  const content = extractContent(data);
  if (!content) throw new Error("dashscope: empty response");
  return content;
}

async function askZai(system: string, user: string): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
  });
  const content: unknown = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM returned an empty response");
  }
  return content.trim();
}

export async function askLLM(
  system: string,
  user: string
): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await askOpenRouter(system, user);
    } catch (err) {
      console.error(
        "[llm] openrouter failed, falling through:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }
  if (process.env.DASHSCOPE_API_KEY) {
    return askDashScope(system, user);
  }
  return askZai(system, user);
}
