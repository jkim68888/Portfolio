"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { EngineName, HistoryTurn } from "@/lib/chat/protocol";
import { isBusy, threadKey, useChatThreads, type Thread } from "./use-chat-session";

export type ChatProject = { slug: string; title: string; questions: string[] };

type ChatContextValue = {
  open: boolean;
  projects: ChatProject[];
  // 지금 대화창에 보이는 대화의 프로젝트. 홈("김지현" 대화)이면 undefined
  projectSlug: string | undefined;
  // 지금 보고 있는 상세 페이지의 프로젝트. 홈이면 undefined
  pageProjectSlug: string | undefined;
  thread: Thread | undefined;
  engine: EngineName;
  busy: boolean;
  openChat: () => void;
  closeChat: () => void;
  send: (text: string) => void;
  stop: () => void;
  changeEngine: (engine: EngineName) => void;
  reset: () => void;
  openConversation: (conversation: { id: string; projectSlug: string | null; turns: HistoryTurn[] }) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat은 ChatProvider 안에서만 쓸 수 있습니다.");
  return value;
}

// 레이아웃에 두어 페이지를 옮겨도 패널 상태와 대화가 유지되게 한다.
// 대화는 페이지마다 따로 두고, 채팅을 열면 지금 페이지의 대화를 보여준다.
export function ChatProvider({ projects, children }: { projects: ChatProject[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pageSlug = pathname.match(/^\/projects\/([^/]+)$/)?.[1];
  const pageProjectSlug = projects.some((project) => project.slug === pageSlug) ? pageSlug : undefined;
  // 채팅 내역에서 다른 프로젝트의 대화를 열면, 페이지를 옮기기 전까지 그 대화를 보여준다(연 페이지 주소로 구분).
  const [override, setOverride] = useState<{ pathname: string; projectSlug: string | undefined }>();
  // 페이지를 옮기면 바로 지운다. 나중에 같은 페이지로 돌아왔을 때 다시 쓰이지 않게 한다.
  if (override && override.pathname !== pathname) setOverride(undefined);
  const projectSlug = override?.pathname === pathname ? override.projectSlug : pageProjectSlug;
  const key = threadKey(projectSlug);

  const { threads, engine, send, stop, changeEngine, reset, loadConversation } = useChatThreads();
  const thread = threads[key];

  // 패널을 닫으면 열었던 버튼으로 포커스를 돌려준다.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openChat = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  const openConversation = useCallback<ChatContextValue["openConversation"]>(
    (conversation) => {
      loadConversation(conversation);
      setOverride({ pathname, projectSlug: conversation.projectSlug ?? undefined });
    },
    [loadConversation, pathname],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      open,
      projects,
      projectSlug,
      pageProjectSlug,
      thread,
      engine,
      busy: isBusy(thread),
      openChat,
      closeChat,
      send: (text) => send(projectSlug, text),
      stop: () => stop(key),
      changeEngine: (next) => changeEngine(next, key),
      reset: () => reset(projectSlug),
      openConversation,
    }),
    [
      open,
      projects,
      projectSlug,
      pageProjectSlug,
      thread,
      engine,
      openChat,
      closeChat,
      send,
      stop,
      changeEngine,
      reset,
      key,
      openConversation,
    ],
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
