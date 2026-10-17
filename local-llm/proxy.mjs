// Ollama 앞에 두는 인증 프록시. Tailscale Funnel은 Ollama(11434)가 아니라 이 프록시만 공개한다.
// 사용법: npm run llm:proxy  (local-llm/.env에 LOCAL_LLM_SECRET 필요, 예시는 local-llm/.env.example)
// - 비밀키(Authorization: Bearer)가 맞는 요청만 통과시킨다. Ollama에는 자체 인증이 없다.
// - 허용 경로: POST /api/chat(답변), GET /health(상태 확인). 모델 다운로드·삭제 같은 나머지 API는 막는다.
// - 모델은 LOCAL_LLM_MODEL로 고정하고, 메모리에서 내리지 않도록 keep_alive: -1을 붙인다.
// - 16GB 메모리라 한 번에 한 질문만 Ollama로 보내고, 나머지는 차례를 기다리게 한다.
import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { Readable } from "node:stream";

const OLLAMA = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const PORT = Number(process.env.LOCAL_LLM_PROXY_PORT ?? 11435);
const MODEL = process.env.LOCAL_LLM_MODEL || "gemma4:e4b";
const SECRET = process.env.LOCAL_LLM_SECRET ?? "";
const MAX_BODY_BYTES = 256 * 1024;
const OPTION_KEYS = ["num_ctx", "temperature"];

if (SECRET.length < 32) {
  console.error("LOCAL_LLM_SECRET이 없거나 너무 짧습니다(32자 이상). 예: openssl rand -hex 32");
  process.exit(1);
}

const secretBuffer = Buffer.from(`Bearer ${SECRET}`);
function authorized(header = "") {
  const given = Buffer.from(header);
  return given.length === secretBuffer.length && timingSafeEqual(given, secretBuffer);
}

// 한 번에 한 질문만 처리한다. 대기 중인 질문 수는 /health의 busy로 알린다.
let queue = Promise.resolve();
let pending = 0;
function runExclusive(task) {
  pending += 1;
  const run = queue.then(task).finally(() => {
    pending -= 1;
  });
  queue = run.catch(() => {});
  return run;
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("요청이 너무 큽니다."), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("JSON 형식이 아닙니다."), { status: 400 });
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function handleChat(req, res) {
  const body = await readJson(req);
  if (!Array.isArray(body.messages)) return sendJson(res, 400, { error: "messages가 필요합니다." });

  // 필요한 필드만 골라 보낸다. 모델·keep_alive는 요청 값과 상관없이 고정한다.
  const options = Object.fromEntries(
    OPTION_KEYS.filter((key) => key in (body.options ?? {})).map((key) => [key, body.options[key]]),
  );
  const payload = {
    model: MODEL,
    messages: body.messages,
    stream: true,
    think: false,
    keep_alive: -1,
    options,
  };

  // 클라이언트가 연결을 끊으면 Ollama 생성도 멈춘다. 대기 중에 끊겼다면 차례가 와도 보내지 않는다.
  const abort = new AbortController();
  res.on("close", () => abort.abort());

  await runExclusive(async () => {
    if (abort.signal.aborted) return;
    const upstream = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: abort.signal,
    });
    res.writeHead(upstream.status, { "content-type": "application/x-ndjson; charset=utf-8" });
    if (!upstream.body) return res.end();
    await new Promise((resolve) => {
      Readable.fromWeb(upstream.body).on("error", resolve).pipe(res).on("finish", resolve).on("close", resolve);
    });
  });
}

async function handleHealth(res) {
  // Ollama가 살아 있는지만 짧게 확인한다.
  const version = await fetch(`${OLLAMA}/api/version`, { signal: AbortSignal.timeout(1000) });
  if (!version.ok) return sendJson(res, 503, { ok: false });
  sendJson(res, 200, { ok: true, model: MODEL, busy: pending > 0 });
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  try {
    if (!authorized(req.headers.authorization)) return sendJson(res, 401, { error: "unauthorized" });
    if (req.method === "POST" && path === "/api/chat") return await handleChat(req, res);
    if (req.method === "GET" && path === "/health") return await handleHealth(res);
    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    if (res.headersSent) return res.destroy();
    if (error.name === "AbortError") return;
    console.error(error);
    sendJson(res, error.status ?? 502, { error: error.status ? error.message : "Ollama 연결 실패" });
  }
});

// 외부에서 바로 접근하지 못하도록 이 Mac 안에서만 연다. 바깥 공개는 Tailscale Funnel이 맡는다.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`인증 프록시: http://127.0.0.1:${PORT} → ${OLLAMA} (모델 ${MODEL})`);
});
