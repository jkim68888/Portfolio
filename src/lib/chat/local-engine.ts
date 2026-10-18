// 로컬 LLM 엔진: Mac의 인증 프록시(Tailscale Funnel로 공개)를 거쳐 Ollama에 질문한다.
// 주소와 비밀키는 서버 환경 변수에만 있고 브라우저로는 보내지 않는다.
import type { ChatMessage, LlmStatus } from "./protocol";

export const LOCAL_MODEL = process.env.LOCAL_LLM_MODEL || "gemma4:e4b";

// Vercel 서버에서 Funnel을 거쳐 Mac까지 처음 연결할 때(배포 직후 등) 1초를 넘기기도 해서 넉넉히 둔다.
const STATUS_TIMEOUT_MS = 3000;
// 온라인 결과는 오래 기억하고, 오프라인 결과는 잠깐의 실패일 수 있어 금방 다시 확인한다.
const ONLINE_CACHE_MS = 30_000;
const OFFLINE_CACHE_MS = 5_000;

function config() {
  const url = process.env.LOCAL_LLM_URL?.replace(/\/$/, "");
  const secret = process.env.LOCAL_LLM_SECRET;
  return url && secret ? { url, secret } : undefined;
}

export const isLocalConfigured = () => config() !== undefined;

// 질문마다 Mac에 상태를 묻지 않도록 결과를 잠시 기억한다. 서버리스 인스턴스마다 따로 기억한다.
let cachedStatus: { value: LlmStatus; expiresAt: number } | undefined;

export async function getLocalStatus({ fresh = false } = {}): Promise<LlmStatus> {
  if (!fresh && cachedStatus && cachedStatus.expiresAt > Date.now()) return cachedStatus.value;

  const local = config();
  let value: LlmStatus = { online: false, busy: false, model: LOCAL_MODEL };
  if (local) {
    try {
      const res = await fetch(`${local.url}/health`, {
        headers: { authorization: `Bearer ${local.secret}` },
        signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as { busy?: boolean };
        value = { online: true, busy: Boolean(body.busy), model: LOCAL_MODEL };
      }
    } catch {
      // 시간 초과·연결 실패는 오프라인으로 본다.
    }
  }
  cachedStatus = { value, expiresAt: Date.now() + (value.online ? ONLINE_CACHE_MS : OFFLINE_CACHE_MS) };
  return value;
}

// 답변 도중 실패하면 다음 상태 확인에서 다시 묻도록 기억을 지운다.
export function forgetLocalStatus() {
  cachedStatus = undefined;
}

export async function* streamLocal({
  system,
  messages,
  signal,
}: {
  system: string;
  messages: ChatMessage[];
  signal: AbortSignal;
}): AsyncGenerator<string> {
  const local = config();
  if (!local) throw new Error("로컬 LLM 설정이 없습니다.");

  const res = await fetch(`${local.url}/api/chat`, {
    method: "POST",
    headers: { authorization: `Bearer ${local.secret}`, "content-type": "application/json" },
    // 벤치마크(scripts/llm-benchmark.mjs)와 같은 설정. gemma4는 think를 끄지 않으면 답이 크게 늦어진다.
    body: JSON.stringify({
      model: LOCAL_MODEL,
      stream: true,
      think: false,
      options: { num_ctx: 16384, temperature: 0.3 },
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal,
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error(`로컬 LLM 응답 오류 (${res.status})`);

  // Ollama는 줄마다 JSON 하나를 보낸다.
  const decoder = new TextDecoder();
  let buffer = "";
  const reader = res.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as { message?: { content?: string }; done?: boolean; error?: string };
      if (event.error) throw new Error(`로컬 LLM 오류: ${event.error}`);
      if (event.message?.content) yield event.message.content;
      if (event.done) return;
    }
  }
  // done 없이 끝났다면 중간에 연결이 끊긴 것이다.
  throw new Error("로컬 LLM 연결이 답변 도중 끊겼습니다.");
}
