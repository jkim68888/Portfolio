import { z } from "zod";
import { checkHistoryLimit, isHistoryAvailable, listHistory } from "@/lib/chat/store";

// 채팅 내역 목록. 방문자 ID는 주소에 남지 않도록 헤더로 받는다.
export async function GET(request: Request) {
  const visitorId = z.uuid().safeParse(request.headers.get("x-chat-visitor"));
  if (!visitorId.success) return Response.json({ error: "방문자 정보가 없습니다." }, { status: 400 });
  if (!isHistoryAvailable()) return Response.json({ available: false, conversations: [] });
  if (!(await checkHistoryLimit(visitorId.data))) {
    return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    const conversations = await listHistory(visitorId.data);
    return Response.json({ available: true, conversations }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[chat] 채팅 내역 조회 실패", error);
    return Response.json({ error: "채팅 내역을 불러오지 못했습니다." }, { status: 500 });
  }
}
