// 방문 로그. 채팅 로그와 같은 Upstash Redis를 쓴다.
// - visit:logs             최근 방문 원본 (list, 최신이 앞)
// - visit:pv:{날짜}        경로별 페이지뷰 (hash, 경로 → 횟수)
// - visit:uv:{날짜}        고유 방문자 수 (HyperLogLog, 브라우저마다 만든 방문자 ID 기준)
// 날짜는 한국 시간 기준이다. 조회는 npm run visit:logs.
import { Redis } from "@upstash/redis";
import { visitorId } from "@/lib/chat/store";

const LOG_KEY = "visit:logs";
const MAX_LOGS = 5000;
// 날짜별 집계는 1년 남짓 보관한다.
const DAILY_TTL_SEC = 400 * 24 * 60 * 60;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
// 배포된 사이트의 방문만 센다. 로컬 개발과 Vercel 미리보기 배포는 남기지 않는다.
const enabled = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NODE_ENV === "production";
const redis = enabled && url && token ? new Redis({ url, token }) : undefined;

// 검색 엔진, 링크 미리보기, 자동화 도구 등 사람이 아닌 방문은 세지 않는다.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|node-fetch/i;
const MOBILE_PATTERN = /Mobi|Android|iPhone|iPad/i;

const formatDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format;

export type VisitLog = {
  at: string;
  path: string;
  // 브라우저마다 만든 방문자 ID(채팅 내역과 같은 값)와 IP 해시(채팅 로그의 visitor와 같은 값)
  visitor: string;
  ip: string;
  // 다른 사이트에서 들어왔으면 그 사이트 주소(도메인만). 사이트 안에서 옮겼거나 직접 들어왔으면 null
  referrer: string | null;
  device: "mobile" | "desktop";
  country: string | null;
};

// 리퍼러는 도메인만 남긴다. 주소 전체에는 검색어 등 개인적인 내용이 들어 있을 수 있다.
function referrerHost(referrer: string | undefined, request: Request) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    return host === new URL(request.url).hostname ? null : host;
  } catch {
    return null;
  }
}

// 저장 실패가 페이지에 영향을 주지 않도록 오류는 기록만 하고 넘긴다.
export async function saveVisit(
  request: Request,
  visit: { path: string; visitorId: string; referrer?: string },
): Promise<void> {
  if (!redis) return;
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return;

  const now = new Date();
  const log: VisitLog = {
    at: now.toISOString(),
    path: visit.path,
    visitor: visit.visitorId,
    ip: visitorId(request),
    referrer: referrerHost(visit.referrer, request),
    device: MOBILE_PATTERN.test(userAgent) ? "mobile" : "desktop",
    country: request.headers.get("x-vercel-ip-country"),
  };
  const date = formatDate(now);
  try {
    await redis
      .pipeline()
      .lpush(LOG_KEY, JSON.stringify(log))
      .ltrim(LOG_KEY, 0, MAX_LOGS - 1)
      .hincrby(`visit:pv:${date}`, visit.path, 1)
      .expire(`visit:pv:${date}`, DAILY_TTL_SEC)
      .pfadd(`visit:uv:${date}`, visit.visitorId)
      .expire(`visit:uv:${date}`, DAILY_TTL_SEC)
      .exec();
  } catch (error) {
    console.error("[visit] 방문 로그 저장 실패", error);
  }
}
