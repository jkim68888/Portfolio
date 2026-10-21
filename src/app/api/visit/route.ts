import { after } from "next/server";
import { z } from "zod";
import { saveVisit } from "@/lib/visits";

const visitSchema = z.object({
  // 사이트 안의 경로만 받는다(예: /, /projects/inven).
  path: z
    .string()
    .max(200)
    .regex(/^\/[a-z0-9/-]*$/),
  visitorId: z.uuid(),
  referrer: z.string().max(2000).optional(),
});

// 페이지를 열 때마다 방문 기록을 남긴다. 저장은 응답한 뒤에 해서 페이지를 기다리게 하지 않는다.
export async function POST(request: Request) {
  const parsed = visitSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  after(() => saveVisit(request, parsed.data));
  return new Response(null, { status: 204 });
}
