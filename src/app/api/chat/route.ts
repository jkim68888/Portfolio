import { after } from "next/server";
import { streamCloud, CLOUD_MODEL } from "@/lib/chat/cloud-engine";
import { selectFocusSlugs } from "@/lib/chat/context";
import {
  forgetLocalStatus,
  getLocalStatus,
  isLocalConfigured,
  LOCAL_MODEL,
  streamLocal,
} from "@/lib/chat/local-engine";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { chatRequestSchema, type ChatEvent, type FallbackReason } from "@/lib/chat/protocol";
import { checkRateLimit, saveChatLog, visitorId, type ChatLog } from "@/lib/chat/store";
import { getProfile } from "@/lib/profile";
import { getChatProjects } from "@/lib/projects";

// 로컬 LLM은 다른 질문을 처리 중이면 차례를 기다리므로 넉넉히 둔다.
export const maxDuration = 120;

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const { messages, projectSlug } = parsed.data;

  const visitor = visitorId(request);
  const limit = await checkRateLimit(visitor);
  if (!limit.ok) {
    return Response.json(
      { error: "질문이 너무 많아요. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  const [projects, profile] = await Promise.all([getChatProjects(), getProfile()]);
  const startedAt = Date.now();

  // 응답이 끝난 뒤 대화 로그를 남긴다. 저장 실패나 지연이 답변에 영향을 주지 않는다.
  const log: ChatLog = {
    at: new Date(startedAt).toISOString(),
    visitor,
    projectSlug: projectSlug ?? null,
    question: messages.at(-1)?.content ?? "",
    answer: "",
    requestedEngine: parsed.data.engine,
    engine: null,
    model: null,
    fallbackReason: null,
    outcome: "aborted",
    firstTokenMs: null,
    totalMs: 0,
  };
  let finish: () => void = () => {};
  const finished = new Promise<void>((resolve) => (finish = resolve));
  after(() => finished.then(() => saveChatLog({ ...log, totalMs: Date.now() - startedAt })));

  // 사용자가 채팅을 닫거나 중단하면 엔진 호출도 멈춘다.
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());
  const { signal } = abort;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        if (event.type === "meta") {
          Object.assign(log, { engine: event.engine, model: event.model, fallbackReason: event.fallbackReason });
          if (event.restart) Object.assign(log, { answer: "", firstTokenMs: null });
        } else if (event.type === "delta") {
          log.firstTokenMs ??= Date.now() - startedAt;
          log.answer += event.text;
        } else {
          log.outcome = event.type;
          if (event.type === "error") log.answer = event.message;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      let fallbackReason: FallbackReason | null = null;
      if (parsed.data.engine === "local") {
        if (!isLocalConfigured()) fallbackReason = "local_not_configured";
        else if (!(await getLocalStatus()).online) fallbackReason = "local_offline";
      }

      try {
        if (parsed.data.engine === "local" && !fallbackReason) {
          send({ type: "meta", engine: "local", model: LOCAL_MODEL, fallbackReason: null });
          try {
            const focusSlugs = selectFocusSlugs(projects, messages, projectSlug);
            const system = buildSystemPrompt(projects, { focusSlugs });
            for await (const text of streamLocal({ system, messages, signal })) send({ type: "delta", text });
            send({ type: "done" });
            return;
          } catch (error) {
            if (signal.aborted) return;
            console.error("[chat] 로컬 LLM 실패, 클라우드로 다시 답변", error);
            forgetLocalStatus();
            fallbackReason = "local_interrupted";
          }
        }

        send({
          type: "meta",
          engine: "cloud",
          model: CLOUD_MODEL,
          fallbackReason,
          ...(fallbackReason === "local_interrupted" && { restart: true as const }),
        });
        // 클라우드는 긴 내용도 빠르게 처리하므로 프로젝트 전체를 상세히 넣는다(프롬프트 캐싱 적용).
        const system = buildSystemPrompt(projects);
        for await (const text of streamCloud({ system, messages, signal })) send({ type: "delta", text });
        send({ type: "done" });
      } catch (error) {
        if (signal.aborted) return;
        console.error("[chat] 클라우드 답변 실패", error);
        send({
          type: "error",
          message: `지금은 답변을 드리기 어렵습니다. 잠시 후 다시 시도해 주시거나 ${profile.email}로 연락 부탁드립니다.`,
        });
      } finally {
        if (!signal.aborted) controller.close();
        finish();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
