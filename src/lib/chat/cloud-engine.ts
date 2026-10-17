// 호스팅 API 엔진: Claude Haiku 5.5로 답한다. 로컬 LLM이 오프라인이거나 사용자가 빠른 답변을 고르면 쓴다.
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./protocol";

export const CLOUD_MODEL = "claude-haiku-5-5";

let client: Anthropic | undefined;

export async function* streamCloud({
  system,
  messages,
  signal,
}: {
  system: string;
  messages: ChatMessage[];
  signal: AbortSignal;
}): AsyncGenerator<string> {
  client ??= new Anthropic();
  const stream = client.messages.stream(
    {
      model: CLOUD_MODEL,
      // 답변은 400자 이내로 짧게 하도록 프롬프트에서 제한한다. 이 값은 비용 상한 역할만 한다.
      max_tokens: 4096,
      // 짧은 질의응답이라 깊게 생각할 필요가 없고, 첫 글자가 빨리 나오는 편이 낫다.
      output_config: { effort: "low" },
      // 시스템 프롬프트(포트폴리오 전체)는 질문마다 같으므로 캐시해 비용과 지연을 줄인다.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
    },
    { signal },
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }

  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new Error("Claude가 답변을 거절했습니다.");
}
