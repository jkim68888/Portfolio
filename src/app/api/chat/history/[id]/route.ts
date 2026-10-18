import { z } from "zod";
import { checkHistoryLimit, getConversation, isHistoryAvailable } from "@/lib/chat/store";

// 채팅 내역 중 대화 하나의 질문·답변 전체. 본인(같은 방문자 ID)의 대화만 볼 수 있다.
export async function GET(request: Request, ctx: RouteContext<"/api/chat/history/[id]">) {
  const visitorId = z.uuid().safeParse(request.headers.get("x-chat-visitor"));
  const conversationId = z.uuid().safeParse((await ctx.params).id);
  if (!visitorId.success || !conversationId.success) {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!isHistoryAvailable()) return Response.json({ error: "채팅 내역을 쓸 수 없습니다." }, { status: 404 });
  if (!(await checkHistoryLimit(visitorId.data))) {
    return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    const conversation = await getConversation(visitorId.data, conversationId.data);
    if (!conversation) return Response.json({ error: "보관 기간이 지났거나 없는 대화입니다." }, { status: 404 });
    return Response.json(conversation, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[chat] 대화 조회 실패", error);
    return Response.json({ error: "대화를 불러오지 못했습니다." }, { status: 500 });
  }
}
