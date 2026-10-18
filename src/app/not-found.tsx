import Link from "next/link";

// 없는 주소나 없는 프로젝트로 들어왔을 때. 기본 404 화면은 영어라서 사이트 언어에 맞춘다.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-start px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold text-pink-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">페이지를 찾을 수 없어요</h1>
      <p className="mt-3 text-zinc-600">주소가 바뀌었거나 없는 페이지예요.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition hover:brightness-110"
      >
        홈으로 가기
      </Link>
    </main>
  );
}
