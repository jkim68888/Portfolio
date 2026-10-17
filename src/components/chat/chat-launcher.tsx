"use client";

import Image from "next/image";
import { useChat } from "./chat-provider";

// 화면 오른쪽 아래의 플로팅 버튼. 패널이 열려 있으면 숨긴다.
export function ChatLauncher() {
  const { open, openChat } = useChat();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-white/90 py-1.5 pr-4 pl-1.5 shadow-xl ring-1 shadow-violet-900/15 ring-violet-200 backdrop-blur transition hover:-translate-y-0.5 hover:ring-violet-300 sm:right-6 sm:bottom-6"
    >
      <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
        <Image src="/avatar.png" alt="" width={44} height={49} className="mt-2 w-10" />
      </span>
      <span className="text-sm font-semibold text-violet-700">AI에게 물어보기</span>
    </button>
  );
}
