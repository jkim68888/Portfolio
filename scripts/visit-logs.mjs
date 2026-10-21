// 방문 로그를 본다. 날짜별 방문자·페이지뷰 요약과 최근 방문 목록을 보여준다.
// 사용법: npm run visit:logs [일수] [개수]   (.env.local의 UPSTASH_REDIS_REST_URL·TOKEN 사용, 기본 14일·30개)
import { Redis } from "@upstash/redis";

const days = Number(process.argv[2] ?? 14);
const count = Number(process.argv[3] ?? 30);
const redis = Redis.fromEnv();

// 서버와 같이 한국 시간 기준 날짜로 묶는다.
const formatDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format;
const dates = Array.from({ length: days }, (_, index) =>
  formatDate(new Date(Date.now() - index * 24 * 60 * 60 * 1000)),
);

const pipeline = redis.pipeline();
for (const date of dates) {
  pipeline.pfcount(`visit:uv:${date}`);
  pipeline.hgetall(`visit:pv:${date}`);
}
const results = await pipeline.exec();

console.log(`최근 ${days}일 (방문자 = 브라우저 기준 고유 방문자, 조회 = 페이지뷰)\n`);
const totals = {};
dates.forEach((date, index) => {
  const visitors = results[index * 2];
  const pages = results[index * 2 + 1] ?? {};
  const views = Object.values(pages).reduce((sum, value) => sum + Number(value), 0);
  for (const [path, value] of Object.entries(pages)) totals[path] = (totals[path] ?? 0) + Number(value);
  console.log(`${date}  방문자 ${String(visitors).padStart(4)}  조회 ${String(views).padStart(5)}`);
});

const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
if (ranking.length > 0) {
  console.log(`\n많이 본 페이지`);
  for (const [path, value] of ranking) console.log(`${String(value).padStart(6)}  ${path}`);
}

const logs = await redis.lrange("visit:logs", 0, count - 1);
if (logs.length === 0) {
  console.log("\n저장된 방문이 없습니다.");
  process.exit(0);
}
console.log(`\n최근 방문 ${logs.length}개`);
for (const log of logs.reverse()) {
  const device = log.device === "mobile" ? "📱" : "🖥️";
  const from = log.referrer ? ` ← ${log.referrer}` : "";
  console.log(
    `[${new Date(log.at).toLocaleString("ko-KR")}] ${device} ${log.country ?? "--"} · 방문자 ${log.visitor.slice(0, 8)} · IP ${log.ip} · ${log.path}${from}`,
  );
}
