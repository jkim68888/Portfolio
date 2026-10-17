import { connection } from "next/server";
import { getLocalStatus } from "@/lib/chat/local-engine";

// 채팅 패널 상단의 로컬 LLM 상태(온라인·오프라인, 다른 질문 처리 중) 표시에 쓴다.
// Mac 주소는 응답에 넣지 않는다.
export async function GET() {
  // 빌드 때 미리 만들지 않고 요청마다 확인한다(결과는 local-engine에서 30초 기억).
  await connection();
  return Response.json(await getLocalStatus(), { headers: { "cache-control": "no-store" } });
}
