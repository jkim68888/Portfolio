"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES,
  type ChatEvent,
  type ChatMessage,
  type EngineName,
  type FallbackReason,
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

export function useChatSession(projectSlug: string | undefined) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [engine, setEngine] = useState<EngineName>("local");
  const abortRef = useRef<AbortController | undefined>(undefined);
  // 답변 도중 엔진을 바꾸면 같은 질문을 다시 보내야 해서, 진행 중인 요청의 대화를 기억한다.
  const pendingRef = useRef<{ history: ChatMessage[]; assistantId: string } | undefined>(undefined);

  const updateMessage = useCallback((id: string, patch: (message: UiMessage) => Partial<UiMessage>) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, ...patch(message) } : message)),
    );
  }, []);

  const run = useCallback(
    async (history: ChatMessage[], assistantId: string, requestEngine: EngineName) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      pendingRef.current = { history, assistantId };
      updateMessage(assistantId, () => ({
        content: "",
        status: "waiting",
        engine: requestEngine,
        model: undefined,
        fallbackReason: null,
        startedAt: Date.now(),
        totalMs: undefined,
      }));

      const fail = (content: string) => updateMessage(assistantId, () => ({ status: "error", content }));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ engine: requestEngine, projectSlug, messages: history }),
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
              updateMessage(assistantId, () => ({
                engine: event.engine,
                model: event.model,
                fallbackReason: event.fallbackReason,
                // 로컬이 답변 도중 끊겨 클라우드로 다시 시작하면 받은 글을 버린다.
                ...(event.restart && { content: "", status: "waiting" as const }),
              }));
            } else if (event.type === "delta") {
              updateMessage(assistantId, (message) => ({
                content: message.content + event.text,
                status: "streaming",
              }));
            } else if (event.type === "done") {
              updateMessage(assistantId, (message) => ({
                status: "done",
                totalMs: Date.now() - (message.startedAt ?? Date.now()),
              }));
            } else {
              fail(event.message);
            }
          }
        }
      } catch {
        // 중단 버튼이나 엔진 전환으로 멈춘 경우는 각각 따로 처리한다.
        if (!controller.signal.aborted) fail("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = undefined;
          pendingRef.current = undefined;
        }
      }
    },
    [projectSlug, updateMessage],
  );

  const send = useCallback(
    (text: string) => {
      const question = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!question) return;
      const user: UiMessage = { id: createId(), role: "user", content: question };
      const assistant: UiMessage = { id: createId(), role: "assistant", content: "", status: "waiting" };
      const history = toHistory([...messages, user]);
      setMessages((current) => [...current, user, assistant]);
      void run(history, assistant.id, engine);
    },
    [engine, messages, run],
  );

  const stop = useCallback(() => {
    const pending = pendingRef.current;
    abortRef.current?.abort();
    if (pending) updateMessage(pending.assistantId, () => ({ status: "stopped" }));
  }, [updateMessage]);

  // 답변 도중 바꾸면 지금 답변을 멈추고 같은 질문을 새 엔진으로 다시 요청한다.
  const changeEngine = useCallback(
    (next: EngineName) => {
      setEngine(next);
      const pending = pendingRef.current;
      if (pending && next !== engine) void run(pending.history, pending.assistantId, next);
    },
    [engine, run],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = messages.some((message) => message.status === "waiting" || message.status === "streaming");
  return { messages, engine, busy, send, stop, changeEngine, reset };
}

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
