"use client";

import Image from "next/image";
import { useChat } from "./chat-provider";

// 화면 오른쪽 가운데의 플로팅 버튼. 패널이 열려 있으면 숨긴다.
// 프로젝트 상세 페이지에서는 그 프로젝트의 대화를, 그 밖의 페이지(홈)에서는 "김지현" 대화를 연다.
// 아바타를 크게 두고 무지개 테두리와 퍼지는 빛으로 눈에 띄게 한다(동작 줄이기 설정이면 빛은 끈다).
export function ChatLauncher() {
  const { open, openChat, projects, pageProjectSlug } = useChat();
  const pageProject = projects.find((project) => project.slug === pageProjectSlug);
  return (
    // 패널이 열려 있는 동안에도 지우지 않고 숨기기만 한다. 패널을 닫으면 이 버튼으로 포커스를 돌려줘야 해서다.
    <button
      type="button"
      onClick={openChat}
      hidden={open}
      className="group fixed top-1/2 right-3 z-40 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 sm:right-6"
    >
      <span className="relative">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-pink-400/50 motion-safe:animate-ping motion-safe:[animation-duration:2.4s]"
        />
        <span className="relative block rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 p-[3px] shadow-xl shadow-pink-500/30 transition group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-pink-500/40">
          <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-gray-100">
            <Image src="/avatar.png" alt="" width={80} height={89} className="mt-4 w-[4.5rem]" />
          </span>
        </span>
        {/* 말풍선 꼬리처럼 붙은 작은 아이콘 */}
        <span
          aria-hidden
          className="absolute -top-1 -left-1 flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-md ring-2 ring-pink-200"
        >
          💬
        </span>
      </span>
      <span className="rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white shadow-lg shadow-violet-500/30 transition group-hover:brightness-110">
        {pageProject ? `${pageProject.title}에 대해 물어보기` : "저에 대해 물어봐주세요"}
      </span>
    </button>
  );
}
