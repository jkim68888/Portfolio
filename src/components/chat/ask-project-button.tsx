"use client";

import { useChat } from "./chat-provider";

// 프로젝트 상세 페이지에서 그 프로젝트를 주제로 채팅을 연다.
export function AskProjectButton({ slug, title }: { slug: string; title: string }) {
  const { openChat } = useChat();
  return (
    <button
      type="button"
      onClick={() => openChat(slug)}
      className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:brightness-110"
    >
      💬 {title}에 대해 물어보기
    </button>
  );
}
