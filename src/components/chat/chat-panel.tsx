"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown";
import { MAX_MESSAGE_LENGTH, type EngineName, type FallbackReason, type LlmStatus } from "@/lib/chat/protocol";
import { useChat } from "./chat-provider";
import { useChatSession, useLlmStatus, type UiMessage } from "./use-chat-session";

// 로컬 LLM의 첫 글자가 이보다 늦으면 빠른 답변으로 전환하라고 안내한다.
const SLOW_FIRST_TOKEN_MS = 5000;

const GENERAL_QUESTIONS = [
  "혼자서 기획부터 배포까지 맡은 프로젝트가 있나요?",
  "React로 개발한 경험이 있는 프로젝트를 알려주세요.",
  "iOS 개발 경험을 소개해 주세요.",
];

const ENGINE_OPTIONS: { value: EngineName; icon: string; label: string }[] = [
  { value: "local", icon: "🖥️", label: "로컬 LLM" },
  { value: "cloud", icon: "☁️", label: "빠른 답변 (Claude)" },
];

const FALLBACK_NOTICES: Record<FallbackReason, string> = {
  local_not_configured: "로컬 LLM이 오프라인이라 클라우드로 답변합니다.",
  local_offline: "로컬 LLM이 오프라인이라 클라우드로 답변합니다.",
  local_interrupted: "로컬 LLM 연결이 끊겨 클라우드로 다시 답변합니다.",
};

const MODEL_NAMES: Record<string, string> = { "claude-haiku-5-5": "Claude Haiku 5.5" };

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}초`;

// 답변을 기다리는 동안 경과 시간을 보여주고 느린 답변을 알아채기 위해 1초마다 갱신한다.
// 서버 렌더링 결과가 시각에 따라 달라지지 않도록 처음 값은 0으로 두고 브라우저에서만 시각을 읽는다.
function useNow(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function StatusBadge({ status }: { status: LlmStatus | undefined }) {
  const { dot, text } = !status
    ? { dot: "bg-gray-300", text: "로컬 LLM 상태 확인 중" }
    : !status.online
      ? { dot: "bg-gray-300", text: "로컬 LLM 오프라인 · 클라우드로 답변" }
      : status.busy
        ? { dot: "bg-amber-400", text: "로컬 LLM 다른 질문 처리 중" }
        : { dot: "bg-emerald-500", text: "로컬 LLM 온라인" };
  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span aria-hidden className={`size-2 rounded-full ${dot}`} />
      {text}
    </p>
  );
}

function EngineLabel({ message, now }: { message: UiMessage; now: number }) {
  const local = message.engine === "local";
  const name = local
    ? `🖥️ 로컬${message.model ? ` · ${message.model} on MacBook` : ""}`
    : `☁️ ${MODEL_NAMES[message.model ?? ""] ?? "Claude"}`;
  const elapsed =
    message.totalMs !== undefined
      ? seconds(message.totalMs)
      : message.startedAt && (message.status === "waiting" || message.status === "streaming")
        ? `${Math.max(0, Math.floor((now - message.startedAt) / 1000))}초째`
        : undefined;
  return (
    <p className="mt-1.5 text-xs text-zinc-400">
      {name}
      {elapsed && ` · ${elapsed}`}
    </p>
  );
}

function AssistantMessage({ message, now }: { message: UiMessage; now: number }) {
  const waiting = message.status === "waiting";
  return (
    <div className="max-w-[92%]" aria-busy={waiting || message.status === "streaming"}>
      {message.fallbackReason && (
        <p className="mb-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs text-sky-800">
          {FALLBACK_NOTICES[message.fallbackReason]}
        </p>
      )}
      <div
        className={`rounded-2xl rounded-tl-sm px-4 py-3 ${message.status === "error" ? "bg-red-50 text-red-800" : "bg-gray-100"}`}
      >
        {waiting ? (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <span aria-hidden className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-violet-400" />
            </span>
            {message.engine === "local" ? "로컬 LLM이 답변을 준비하고 있어요" : "답변을 준비하고 있어요"}
          </p>
        ) : message.status === "error" ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <MarkdownContent
            content={message.content}
            className="prose-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          />
        )}
        {message.status === "stopped" && <p className="mt-2 text-xs text-zinc-500">답변을 중단했어요.</p>}
      </div>
      {message.status !== "error" && <EngineLabel message={message} now={now} />}
    </div>
  );
}

export function ChatPanel() {
  const { open, projectSlug, projects, closeChat, clearProject } = useChat();
  const { messages, engine, busy, send, stop, changeEngine, reset } = useChatSession(projectSlug);
  const status = useLlmStatus(open, busy);
  const now = useNow(open && busy);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const project = projects.find((item) => item.slug === projectSlug);
  const suggestions = project && project.questions.length > 0 ? project.questions : GENERAL_QUESTIONS;
  const pending = messages.findLast((message) => message.role === "assistant" && message.status === "waiting");
  const slow =
    pending?.engine === "local" && pending.startedAt !== undefined && now - pending.startedAt > SLOW_FIRST_TOKEN_MS;

  // 열면 입력창으로 포커스를 옮기고, ESC로 닫는다.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", onKeyDown);
    // 모바일 전체 화면에서는 뒤 페이지가 같이 스크롤되지 않게 막는다.
    const lockScroll = window.matchMedia("(max-width: 639px)").matches;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) document.body.style.overflow = "";
    };
  }, [open, closeChat]);

  // 새 글이 오면 맨 아래로 내린다.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  if (!open) return null;

  const submit = (text: string) => {
    if (busy || !text.trim()) return;
    send(text);
    setInput("");
  };

  return (
    <section
      role="dialog"
      aria-labelledby="chat-title"
      className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:border-l sm:border-violet-100 sm:shadow-2xl sm:shadow-violet-900/10"
    >
      <header className="border-b border-gray-100 px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
            <Image src="/avatar.png" alt="" width={40} height={44} className="mt-2 w-9" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="chat-title" className="text-base font-bold tracking-tight">
              김지현에게 물어보기
            </h2>
            <StatusBadge status={status} />
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-zinc-500 hover:bg-gray-100 hover:text-zinc-800"
            >
              새 대화
            </button>
          )}
          <button
            type="button"
            onClick={closeChat}
            aria-label="채팅 닫기"
            className="flex size-9 items-center justify-center rounded-md text-xl text-zinc-500 hover:bg-gray-100 hover:text-zinc-800"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div role="group" aria-label="답변 엔진" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {ENGINE_OPTIONS.map((option) => {
            const selected = engine === option.value;
            const highlight = slow && option.value === "cloud";
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => changeEngine(option.value)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  selected
                    ? "bg-white text-violet-700 shadow-sm"
                    : highlight
                      ? "animate-pulse bg-violet-100 text-violet-800 ring-2 ring-violet-400"
                      : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span aria-hidden>{option.icon}</span> {option.label}
              </button>
            );
          })}
        </div>
        {slow && (
          <p className="mt-2 text-xs text-violet-700" role="status">
            답변이 느리면 빠른 답변으로 전환해 보세요.
          </p>
        )}

        {project && (
          <p className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
            <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
              {project.title}에 대해 질문 중
            </span>
            <button type="button" onClick={clearProject} className="text-zinc-400 underline hover:text-zinc-700">
              전체 프로젝트로 묻기
            </button>
          </p>
        )}
      </header>

      <div ref={logRef} role="log" aria-label="대화 내용" className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div>
            <p className="text-sm leading-relaxed text-zinc-600">
              안녕하세요, 김지현입니다. 포트폴리오에 담긴 프로젝트와 경험에 대해 편하게 물어봐 주세요.
            </p>
            <ul className="mt-4 flex flex-col items-start gap-2" aria-label="추천 질문">
              {suggestions.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => submit(question)}
                    className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-left text-sm text-violet-700 transition hover:bg-violet-50"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-2.5 text-sm whitespace-pre-wrap text-white">
                {message.content}
              </p>
            </div>
          ) : (
            <AssistantMessage key={message.id} message={message} now={now} />
          ),
        )}
      </div>

      <footer className="border-t border-gray-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            질문 입력
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // 한글 조합 중 Enter는 글자 확정이라 보내지 않는다. Shift+Enter는 줄바꿈.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="프로젝트에 대해 물어보세요"
            className="[field-sizing:content] max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="h-11 shrink-0 rounded-xl bg-zinc-800 px-4 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              중단
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-11 shrink-0 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400"
            >
              보내기
            </button>
          )}
        </form>
        <p className="mt-2 text-[11px] leading-snug text-zinc-400">
          AI가 포트폴리오 내용을 바탕으로 답변합니다. 대화 내용은 개선을 위해 저장됩니다.
        </p>
      </footer>
    </section>
  );
}
