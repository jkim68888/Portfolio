// 요청 제한과 대화 로그. 둘 다 Upstash Redis를 쓴다.
// UPSTASH_REDIS_REST_URL·UPSTASH_REDIS_REST_TOKEN이 없으면(로컬 개발 등) 둘 다 건너뛴다.
// Redis 장애가 답변을 막지 않도록, 실패하면 요청 제한은 통과시키고 로그는 버린다.
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  HISTORY_TTL_DAYS,
  type EngineName,
  type FallbackReason,
  type HistoryConversation,
  type HistoryTurn,
} from "./protocol";

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

// 채팅 내역 조회는 답변을 만들지 않아 비용이 들지 않으므로 질문보다 넉넉하게 허용한다.
const historyLimiter = redis
  ? new Ratelimit({ redis, prefix: "chat:rl:history", limiter: Ratelimit.slidingWindow(30, "1 m") })
  : undefined;

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

// 채팅 내역: 방문자(브라우저마다 만든 무작위 ID)별로 대화를 모은다. 운영용 로그(chat:logs)와 따로 둔다.
// - chat:hist:{visitor}             대화 ID 목록 (sorted set, 점수 = 마지막 질문 시각)
// - chat:hist:{visitor}:{대화 ID}   질문·답변 목록 (list, 첫 항목에 프로젝트를 함께 기록)
// 대화마다 마지막 질문 후 HISTORY_TTL_DAYS가 지나면 사라진다.
const HISTORY_TTL_SEC = HISTORY_TTL_DAYS * 24 * 60 * 60;
const MAX_CONVERSATIONS = 30;
const MAX_TURNS = 50;

type StoredTurn = HistoryTurn & { projectSlug: string | null };

const indexKey = (visitorId: string) => `chat:hist:${visitorId}`;
const conversationKey = (visitorId: string, conversationId: string) => `chat:hist:${visitorId}:${conversationId}`;

export const isHistoryAvailable = () => redis !== undefined;

export async function checkHistoryLimit(visitorId: string) {
  if (!historyLimiter) return true;
  try {
    return (await historyLimiter.limit(visitorId)).success;
  } catch {
    return true;
  }
}

export async function saveHistoryTurn(visitorId: string, conversationId: string, turn: StoredTurn): Promise<void> {
  if (!redis) return;
  const index = indexKey(visitorId);
  const key = conversationKey(visitorId, conversationId);
  try {
    await redis
      .pipeline()
      .rpush(key, JSON.stringify(turn))
      .ltrim(key, -MAX_TURNS, -1)
      .expire(key, HISTORY_TTL_SEC)
      .zadd(index, { score: Date.parse(turn.at), member: conversationId })
      // 오래된 대화부터 지워 최근 MAX_CONVERSATIONS개만 남긴다.
      .zremrangebyrank(index, 0, -MAX_CONVERSATIONS - 1)
      .expire(index, HISTORY_TTL_SEC)
      .exec();
  } catch (error) {
    console.error("[chat] 채팅 내역 저장 실패", error);
  }
}

const parseTurn = (value: unknown): StoredTurn => (typeof value === "string" ? JSON.parse(value) : value) as StoredTurn;

export async function listHistory(visitorId: string): Promise<HistoryConversation[]> {
  if (!redis) return [];
  const index = indexKey(visitorId);
  // 보관 기간이 지난 대화는 목록에서도 지운다.
  await redis.zremrangebyscore(index, 0, Date.now() - HISTORY_TTL_SEC * 1000);
  const ids = await redis.zrange<string[]>(index, 0, -1, { rev: true });
  if (ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.lindex(conversationKey(visitorId, id), 0);
    pipeline.lindex(conversationKey(visitorId, id), -1);
    pipeline.llen(conversationKey(visitorId, id));
  }
  const results = await pipeline.exec();

  return ids.flatMap((id, index) => {
    const [first, last, count] = results.slice(index * 3, index * 3 + 3);
    if (!first || !last) return [];
    const firstTurn = parseTurn(first);
    return [
      {
        id,
        projectSlug: firstTurn.projectSlug,
        firstQuestion: firstTurn.question,
        updatedAt: parseTurn(last).at,
        turnCount: Number(count),
      },
    ];
  });
}

export async function getConversation(
  visitorId: string,
  conversationId: string,
): Promise<{ projectSlug: string | null; turns: HistoryTurn[] } | undefined> {
  if (!redis) return undefined;
  const values = await redis.lrange(conversationKey(visitorId, conversationId), 0, -1);
  if (values.length === 0) return undefined;
  const turns = values.map(parseTurn);
  return {
    projectSlug: turns[0].projectSlug,
    turns: turns.map(({ projectSlug: _projectSlug, ...turn }) => turn),
  };
}
