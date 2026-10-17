import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProjects } from "@/lib/projects";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "김지현 | 프론트엔드 개발자 포트폴리오",
  description: "프론트엔드 개발자 김지현의 포트폴리오입니다. 프로젝트에 대해 챗봇에게 직접 물어볼 수 있습니다.",
  // 링크를 아는 사람만 보도록 검색 결과에서 제외. robots.txt로 크롤링을 막으면 noindex를 읽지 못하므로 막지 않음
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 채팅 패널의 프로젝트 이름과 추천 질문(본인이 쓴 예상 질문 중 앞의 3개)
  const chatProjects = (await getProjects()).map(({ slug, title, interviewQA }) => ({
    slug,
    title,
    questions: interviewQA.slice(0, 3).map(({ question }) => question),
  }));

  return (
    <html lang="ko" className={`${pretendard.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          본문으로 건너뛰기
        </a>
        <ChatProvider projects={chatProjects}>
          <SiteHeader />
          <div id="main" className="flex-1">
            {children}
          </div>
          <SiteFooter />
          <ChatLauncher />
          <ChatPanel />
        </ChatProvider>
      </body>
    </html>
  );
}
