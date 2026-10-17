import ZAI from "z-ai-web-dev-sdk";

/**
 * Thin wrapper over the sandbox AI SDK chat completion (server-side only).
 * The verified-working call shape: system prompt rides as the leading
 * "assistant" message, thinking disabled, plain (non-streamed) completion.
 */
export async function askLLM(system: string, user: string): Promise<string> {
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
