"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES,
  type ChatEvent,
  type ChatMessage,
  type EngineName,
  type FallbackReason,
  type HistoryTurn,
  type LlmStatus,
} from "@/lib/chat/protocol";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // 아래는 답변에만 쓴다.
  status?: "waiting" | "streaming" | "done" | "stopped" | "error";
  engine?: EngineName;
  model?: string;
  fallbackReason?: FallbackReason | null;
  startedAt?: number;
  totalMs?: number;
};

const STATUS_POLL_MS = 30_000;

let nextId = 0;
const createId = () => `m${Date.now()}-${nextId++}`;

// 서버로 보낼 대화. 끝난 답변만 넣고, 서버 검증 한도(개수·길이)에 맞춘다.
function toHistory(messages: UiMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.role === "user" || (message.status === "done" && message.content))
    .map((message) => ({ role: message.role, content: message.content.slice(0, MAX_MESSAGE_LENGTH) }))
    .slice(-MAX_MESSAGES);
}

// 대화는 페이지마다 따로 둔다. 상세 페이지는 그 프로젝트 slug, 홈은 "김지현" 대화(ABOUT_KEY).
export const ABOUT_KEY = "about";
export const threadKey = (projectSlug: string | undefined) => projectSlug ?? ABOUT_KEY;

export type Thread = {
  // 채팅 내역(Redis)에서 대화를 묶는 ID. 새 대화를 시작하면 새로 만든다.
  conversationId: string;
  projectSlug: string | undefined;
  messages: UiMessage[];
};

type Pending = { controller: AbortController; history: ChatMessage[]; assistantId: string };

// 탭을 닫기 전까지는 새로고침해도 쓰던 대화가 남도록 sessionStorage에 둔다.
const THREADS_STORAGE_KEY = "chat:threads";
// 채팅 내역을 찾는 방문자 ID. 탭을 닫았다가 다시 와도 같은 브라우저면 내역이 보이도록 localStorage에 둔다.
const VISITOR_STORAGE_KEY = "chat:visitor-id";

let memoryVisitorId: string | undefined;
export function getVisitorId() {
  try {
    const saved = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    // 저장소를 쓸 수 없는 환경(일부 시크릿 모드 등)에서는 이 탭에서만 쓴다.
    memoryVisitorId ??= crypto.randomUUID();
    return memoryVisitorId;
  }
}

const newThread = (projectSlug: string | undefined): Thread => ({
  conversationId: crypto.randomUUID(),
  projectSlug,
  messages: [],
});

function restoreThreads(): Record<string, Thread> {
  try {
    const saved = JSON.parse(sessionStorage.getItem(THREADS_STORAGE_KEY) ?? "{}") as Record<string, Thread>;
    // 새로고침 직전에 받던 답변은 이어 받을 수 없으므로 중단된 것으로 표시한다.
    for (const thread of Object.values(saved)) {
      thread.messages = thread.messages.map((message) =>
        message.status === "waiting" || message.status === "streaming" ? { ...message, status: "stopped" } : message,
      );
    }
    return saved;
  } catch {
    return {};
  }
}

export function useChatThreads() {
  // 서버 렌더링 때는 저장소가 없어 빈 값이고, 대화는 패널을 연 뒤에만 그리므로 화면이 어긋나지 않는다.
  const [threads, setThreads] = useState<Record<string, Thread>>(() =>
    typeof window === "undefined" ? {} : restoreThreads(),
  );
  const [engine, setEngine] = useState<EngineName>("local");
  // 비동기로 답변을 받는 동안 최신 대화를 읽기 위해 둔다.
  const threadsRef = useRef(threads);
  // 대화마다 진행 중인 요청. 답변 도중 다른 페이지로 옮겨도 원래 대화에서 끝까지 받는다.
  const pendingRef = useRef(new Map<string, Pending>());

  useEffect(() => {
    threadsRef.current = threads;
    try {
      sessionStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // 저장하지 못해도 이 탭에서는 계속 쓸 수 있다.
    }
  }, [threads]);

  const updateThread = useCallback((key: string, patch: (thread: Thread) => Thread) => {
    setThreads((current) => (current[key] ? { ...current, [key]: patch(current[key]) } : current));
  }, []);

  const updateMessage = useCallback(
    (key: string, id: string, patch: (message: UiMessage) => Partial<UiMessage>) => {
      updateThread(key, (thread) => ({
        ...thread,
        messages: thread.messages.map((message) => (message.id === id ? { ...message, ...patch(message) } : message)),
      }));
    },
    [updateThread],
  );

  const run = useCallback(
    async (key: string, history: ChatMessage[], assistantId: string, requestEngine: EngineName) => {
      pendingRef.current.get(key)?.controller.abort();
      const controller = new AbortController();
      const pending = { controller, history, assistantId };
      pendingRef.current.set(key, pending);
      const thread = threadsRef.current[key];
      const update = (patch: (message: UiMessage) => Partial<UiMessage>) => updateMessage(key, assistantId, patch);
      update(() => ({
        content: "",
        status: "waiting",
        engine: requestEngine,
        model: undefined,
        fallbackReason: null,
        startedAt: Date.now(),
        totalMs: undefined,
      }));

      const fail = (content: string) => update(() => ({ status: "error", content }));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            engine: requestEngine,
            projectSlug: thread?.projectSlug,
            visitorId: getVisitorId(),
            conversationId: thread?.conversationId,
            messages: history,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          return fail(body.error ?? "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatEvent;
            if (event.type === "meta") {
              update(() => ({
                engine: event.engine,
                model: event.model,
                fallbackReason: event.fallbackReason,
                // 로컬이 답변 도중 끊겨 클라우드로 다시 시작하면 받은 글을 버린다.
                ...(event.restart && { content: "", status: "waiting" as const }),
              }));
            } else if (event.type === "delta") {
              update((message) => ({ content: message.content + event.text, status: "streaming" }));
            } else if (event.type === "done") {
              update((message) => ({ status: "done", totalMs: Date.now() - (message.startedAt ?? Date.now()) }));
            } else {
              fail(event.message);
            }
          }
        }
      } catch {
        // 중단 버튼이나 엔진 전환으로 멈춘 경우는 각각 따로 처리한다.
        if (!controller.signal.aborted) fail("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (pendingRef.current.get(key) === pending) pendingRef.current.delete(key);
      }
    },
    [updateMessage],
  );

  const send = useCallback(
    (projectSlug: string | undefined, text: string) => {
      const question = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!question) return;
      const key = threadKey(projectSlug);
      const thread = threadsRef.current[key] ?? newThread(projectSlug);
      const user: UiMessage = { id: createId(), role: "user", content: question };
      const assistant: UiMessage = { id: createId(), role: "assistant", content: "", status: "waiting" };
      const history = toHistory([...thread.messages, user]);
      const next = { ...thread, messages: [...thread.messages, user, assistant] };
      threadsRef.current = { ...threadsRef.current, [key]: next };
      setThreads((current) => ({ ...current, [key]: next }));
      void run(key, history, assistant.id, engine);
    },
    [engine, run],
  );

  const stop = useCallback(
    (key: string) => {
      const pending = pendingRef.current.get(key);
      if (!pending) return;
      pending.controller.abort();
      updateMessage(key, pending.assistantId, () => ({ status: "stopped" }));
    },
    [updateMessage],
  );

  // 답변 도중 바꾸면 지금 보고 있는 대화의 답변을 멈추고 같은 질문을 새 엔진으로 다시 요청한다.
  const changeEngine = useCallback(
    (next: EngineName, key: string) => {
      setEngine(next);
      const pending = pendingRef.current.get(key);
      if (pending && next !== engine) void run(key, pending.history, pending.assistantId, next);
    },
    [engine, run],
  );

  // 새 대화: 대화창만 비운다. 지난 대화는 채팅 내역에서 다시 볼 수 있다.
  const reset = useCallback((projectSlug: string | undefined) => {
    const key = threadKey(projectSlug);
    pendingRef.current.get(key)?.controller.abort();
    pendingRef.current.delete(key);
    setThreads((current) => ({ ...current, [key]: newThread(projectSlug) }));
  }, []);

  // 채팅 내역에서 고른 대화를 그 프로젝트의 대화창으로 불러와 이어서 질문할 수 있게 한다.
  const loadConversation = useCallback(
    (conversation: { id: string; projectSlug: string | null; turns: HistoryTurn[] }) => {
      const projectSlug = conversation.projectSlug ?? undefined;
      const key = threadKey(projectSlug);
      pendingRef.current.get(key)?.controller.abort();
      pendingRef.current.delete(key);
      const messages = conversation.turns.flatMap((turn): UiMessage[] => [
        { id: createId(), role: "user", content: turn.question },
        {
          id: createId(),
          role: "assistant",
          content: turn.answer,
          status: "done",
          engine: turn.engine,
          model: turn.model,
          fallbackReason: null,
          totalMs: turn.totalMs,
        },
      ]);
      setThreads((current) => ({ ...current, [key]: { conversationId: conversation.id, projectSlug, messages } }));
      return key;
    },
    [],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => pending.forEach(({ controller }) => controller.abort());
  }, []);

  return { threads, engine, send, stop, changeEngine, reset, loadConversation };
}

export const isBusy = (thread: Thread | undefined) =>
  thread?.messages.some((message) => message.status === "waiting" || message.status === "streaming") ?? false;

// 패널이 열려 있는 동안 로컬 LLM 상태를 주기적으로 확인한다. 답변이 끝나면(refreshKey 변경) 바로 다시 확인한다.
export function useLlmStatus(active: boolean, refreshKey?: unknown) {
  const [status, setStatus] = useState<LlmStatus | undefined>(undefined);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/llm-status")
        .then((res) => res.json() as Promise<LlmStatus>)
        .then((value) => !cancelled && setStatus(value))
        .catch(() => !cancelled && setStatus(undefined));
    void load();
    const timer = setInterval(load, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, refreshKey]);
  return status;
}
