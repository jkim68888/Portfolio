// /api/chat 요청·응답 형식. 서버와 채팅 UI가 함께 쓴다.
// 응답은 줄마다 JSON 하나(NDJSON)이고, 엔진 종류와 상관없이 같은 이벤트로 흐른다.
import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_MESSAGES = 20;

export const chatRequestSchema = z.object({
  engine: z.enum(["local", "cloud"]),
  // 프로젝트 상세 페이지에서 연 채팅이면 그 프로젝트 slug
  projectSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages.at(-1)?.role === "user", "마지막 메시지는 질문이어야 합니다."),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessage = ChatRequest["messages"][number];
export type EngineName = ChatRequest["engine"];

// 로컬 LLM 대신 클라우드로 답하게 된 이유
export type FallbackReason =
  | "local_not_configured" // LOCAL_LLM_URL·LOCAL_LLM_SECRET이 없음
  | "local_offline" // 상태 확인에 실패 (Mac 꺼짐, 네트워크 끊김)
  | "local_interrupted"; // 답변 도중 연결이 끊기거나 오류가 남

export type ChatEvent =
  // 맨 앞에 한 번. 답변 도중 클라우드로 다시 시작하면 restart: true로 한 번 더 오고, 그때까지 받은 글은 버린다.
  | { type: "meta"; engine: EngineName; model: string; fallbackReason: FallbackReason | null; restart?: true }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type LlmStatus = { online: boolean; busy: boolean; model: string };
