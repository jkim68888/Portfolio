"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ChatProject = { slug: string; title: string; questions: string[] };

type ChatContextValue = {
  open: boolean;
  projectSlug: string | undefined;
  projects: ChatProject[];
  openChat: (projectSlug?: string) => void;
  closeChat: () => void;
  clearProject: () => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat은 ChatProvider 안에서만 쓸 수 있습니다.");
  return value;
}

// 레이아웃에 두어 페이지를 옮겨도 패널 상태와 대화가 유지되게 한다.
export function ChatProvider({ projects, children }: { projects: ChatProject[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [projectSlug, setProjectSlug] = useState<string | undefined>(undefined);
  // 패널을 닫으면 열었던 버튼으로 포커스를 돌려준다.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openChat = useCallback((slug?: string) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    if (slug) setProjectSlug(slug);
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  const clearProject = useCallback(() => setProjectSlug(undefined), []);

  const value = useMemo(
    () => ({ open, projectSlug, projects, openChat, closeChat, clearProject }),
    [open, projectSlug, projects, openChat, closeChat, clearProject],
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
