// 요청 제한과 대화 로그. 둘 다 Upstash Redis를 쓴다.
// UPSTASH_REDIS_REST_URL·UPSTASH_REDIS_REST_TOKEN이 없으면(로컬 개발 등) 둘 다 건너뛴다.
// Redis 장애가 답변을 막지 않도록, 실패하면 요청 제한은 통과시키고 로그는 버린다.
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { EngineName, FallbackReason } from "./protocol";

const LOG_KEY = "chat:logs";
// 주 1회 확인하는 용도라 최근 것만 남긴다(무료 플랜 용량 256MB에 비해 넉넉히 작다).
const MAX_LOGS = 5000;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : undefined;

// 질문 하나에 비용이 드는 만큼, 사람이 대화하는 속도보다 조금 넉넉하게만 허용한다.
const limiters = redis
  ? [
      new Ratelimit({ redis, prefix: "chat:rl:min", limiter: Ratelimit.slidingWindow(6, "1 m") }),
      new Ratelimit({ redis, prefix: "chat:rl:day", limiter: Ratelimit.slidingWindow(60, "1 d") }),
    ]
  : [];

// IP는 그대로 저장하지 않는다. 같은 방문자의 질문끼리 묶어 볼 수 있을 정도로만 해시한다.
// Redis 토큰을 소금(salt)으로 써서, 로그만 보고는 IP를 되돌릴 수 없게 한다.
export function visitorId(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256")
    .update(`${token ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

export async function checkRateLimit(visitor: string): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    const results = await Promise.all(limiters.map((limiter) => limiter.limit(visitor)));
    const blocked = results.find((result) => !result.success);
    if (!blocked) return { ok: true };
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((blocked.reset - Date.now()) / 1000)) };
  } catch (error) {
    console.error("[chat] 요청 제한 확인 실패, 통과시킴", error);
    return { ok: true };
  }
}

export type ChatLog = {
  at: string;
  visitor: string;
  projectSlug: string | null;
  question: string;
  answer: string;
  // 처음 요청한 엔진과 실제로 답한 엔진. 다르면 자동 전환된 것이다.
  requestedEngine: EngineName;
  engine: EngineName | null;
  model: string | null;
  fallbackReason: FallbackReason | null;
  outcome: "done" | "error" | "aborted";
  firstTokenMs: number | null;
  totalMs: number;
};

export async function saveChatLog(log: ChatLog) {
  if (!redis) return;
  try {
    await redis
      .pipeline()
      .lpush(LOG_KEY, JSON.stringify(log))
      .ltrim(LOG_KEY, 0, MAX_LOGS - 1)
      .exec();
  } catch (error) {
    console.error("[chat] 대화 로그 저장 실패", error);
  }
}
