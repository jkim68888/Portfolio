import { connection } from "next/server";
import { getLocalStatus } from "@/lib/chat/local-engine";

// 채팅 패널 상단의 로컬 LLM 상태(온라인·오프라인, 다른 질문 처리 중) 표시에 쓴다.
// Mac 주소는 응답에 넣지 않는다.
export async function GET() {
  // 빌드 때 미리 만들지 않고 요청마다 Mac에 직접 묻는다. 기억해 둔 값을 쓰면 답변이 끝난 뒤에도 "처리 중"으로 남는다.
  // 새로 확인한 값은 /api/chat이 쓸 수 있게 local-engine에 다시 기억된다.
  await connection();
  return Response.json(await getLocalStatus({ fresh: true }), { headers: { "cache-control": "no-store" } });
}
