// 최근 챗봇 대화 로그를 본다. 주 1회 자주 나온 질문을 확인해 콘텐츠를 보강하는 용도.
// 사용법: npm run chat:logs [개수]   (.env.local의 UPSTASH_REDIS_REST_URL·TOKEN 사용, 기본 30개)
import { Redis } from "@upstash/redis";

const count = Number(process.argv[2] ?? 30);
const redis = Redis.fromEnv();
const logs = await redis.lrange("chat:logs", 0, count - 1);

if (logs.length === 0) {
  console.log("저장된 대화가 없습니다.");
  process.exit(0);
}

const seconds = (ms) => (ms == null ? "-" : `${(ms / 1000).toFixed(1)}초`);
for (const log of logs.reverse()) {
  const engine = log.engine === "local" ? "🖥️ 로컬" : log.engine === "cloud" ? "☁️ Claude" : "-";
  const fallback = log.fallbackReason ? ` (자동 전환: ${log.fallbackReason})` : "";
  console.log(
    `\n[${new Date(log.at).toLocaleString("ko-KR")}] ${log.projectSlug ?? "전체"} · 방문자 ${log.visitor} · ${engine}${fallback} · ${log.outcome} · 첫 글자 ${seconds(log.firstTokenMs)} · 전체 ${seconds(log.totalMs)}`,
  );
  console.log(`Q. ${log.question}`);
  console.log(`A. ${log.answer}`);
}
