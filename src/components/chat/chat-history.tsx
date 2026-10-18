"use client";

import { useEffect, useState } from "react";
import { HISTORY_TTL_DAYS, type HistoryConversation, type HistoryTurn } from "@/lib/chat/protocol";
import { useChat } from "./chat-provider";
import { getVisitorId } from "./use-chat-session";

type LoadState =
  { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; conversations: HistoryConversation[] };

const ABOUT_TITLE = "김지현";

const formatDate = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "x-chat-visitor": getVisitorId() }, cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "채팅 내역을 불러오지 못했습니다.");
  return body;
}

// 이 브라우저에서 나눈 대화를 프로젝트별로 묶어 보여준다. 고르면 그 대화를 불러와 이어서 질문할 수 있다.
export function ChatHistory({ onOpened }: { onOpened: () => void }) {
  const { projects, thread, openConversation } = useChat();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [openingId, setOpeningId] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    fetchJson<{ available: boolean; conversations: HistoryConversation[] }>("/api/chat/history")
      .then(({ available, conversations }) => {
        if (cancelled) return;
        setState(
          available ? { kind: "ready", conversations } : { kind: "error", message: "지금은 채팅 내역을 볼 수 없어요." },
        );
      })
      .catch((error: Error) => !cancelled && setState({ kind: "error", message: error.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  const open = async (conversation: HistoryConversation) => {
    setOpeningId(conversation.id);
    try {
      const detail = await fetchJson<{ projectSlug: string | null; turns: HistoryTurn[] }>(
        `/api/chat/history/${conversation.id}`,
      );
      openConversation({ id: conversation.id, ...detail });
      onOpened();
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
    } finally {
      setOpeningId(undefined);
    }
  };

  const titleOf = (slug: string | null) =>
    slug ? (projects.find((project) => project.slug === slug)?.title ?? slug) : ABOUT_TITLE;

  // 가장 최근에 대화한 프로젝트부터, 같은 프로젝트 안에서도 최근 대화부터 보여준다.
  const groups =
    state.kind === "ready"
      ? state.conversations.reduce<{ slug: string | null; items: HistoryConversation[] }[]>((acc, item) => {
          const group = acc.find((entry) => entry.slug === item.projectSlug);
          if (group) group.items.push(item);
          else acc.push({ slug: item.projectSlug, items: [item] });
          return acc;
        }, [])
      : [];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5">
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-zinc-600">
        채팅 내역은 대화마다 마지막 질문 후 {HISTORY_TTL_DAYS}일 동안 보관되고, 이 브라우저에서만 볼 수 있어요. 대화를
        고르면 이어서 질문할 수 있어요.
      </p>

      {state.kind === "loading" && (
        <p className="mt-6 text-sm text-zinc-500" role="status">
          채팅 내역을 불러오고 있어요…
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === "ready" && groups.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">아직 채팅 내역이 없어요.</p>
      )}

      {groups.map((group) => (
        <section key={group.slug ?? "about"} className="mt-6" aria-labelledby={`history-${group.slug ?? "about"}`}>
          <h3 id={`history-${group.slug ?? "about"}`} className="text-sm font-bold text-zinc-800">
            {titleOf(group.slug)}
          </h3>
          <ul className="mt-2 space-y-2">
            {group.items.map((item) => {
              const current = thread?.conversationId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void open(item)}
                    disabled={openingId !== undefined}
                    aria-current={current ? "true" : undefined}
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="line-clamp-2 text-sm text-zinc-800">{item.firstQuestion}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                      <span>{formatDate(new Date(item.updatedAt))}</span>
                      <span>· 질문 {item.turnCount}개</span>
                      {current && <span className="font-medium text-violet-700">· 지금 대화</span>}
                      {openingId === item.id && <span>· 불러오는 중…</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
