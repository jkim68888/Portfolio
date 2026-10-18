// 로컬 LLM에 상세 내용을 넣을 프로젝트를 고른다. 내용이 길면 첫 글자까지 수십 초가 걸리므로 1~2개로 줄인다.
// 순서: ① 상세 페이지에서 연 채팅이면 그 프로젝트 ② 질문에 프로젝트명(별칭 keywords 포함)·회사명·기술명이 있으면 키워드 매칭 ③ 없으면 요약 목록만
import type { ChatMessage } from "./protocol";
import type { ProjectForPrompt } from "./prompt";

const MAX_FOCUS = 2;
// 앞선 질문의 프로젝트를 이어서 묻는 경우("그 프로젝트에서는요?")가 많아 최근 질문 몇 개까지 본다.
const RECENT_QUESTIONS = 3;

const normalize = (text: string) => text.toLowerCase().replace(/\(주\)|\s/g, "");

export function selectFocusSlugs(
  projects: ProjectForPrompt[],
  messages: ChatMessage[],
  projectSlug?: string,
): string[] {
  const focus = new Set<string>();
  if (projectSlug && projects.some((project) => project.slug === projectSlug)) focus.add(projectSlug);

  // 최근 질문부터 보고, 같은 질문 안에서는 이름 → 회사 → 기술 순으로 확실한 것을 먼저 고른다.
  const questions = messages
    .filter((message) => message.role === "user")
    .slice(-RECENT_QUESTIONS)
    .reverse()
    .map((message) => normalize(message.content));

  for (const question of questions) {
    const byName = projects.filter((project) =>
      [project.title, ...(project.keywords ?? [])].some((name) => question.includes(normalize(name))),
    );
    const byCompany = projects.filter((project) => project.company && question.includes(normalize(project.company)));
    // React처럼 여러 프로젝트에 쓰인 기술은 고를 기준이 못 되므로, 2개 이하에만 해당하는 기술만 본다.
    const byStack = projects.filter((project) =>
      project.stack.some((tech) => {
        const users = projects.filter((other) => other.stack.includes(tech)).length;
        return users <= MAX_FOCUS && question.includes(normalize(tech));
      }),
    );
    for (const project of [...byName, ...byCompany, ...byStack]) {
      if (focus.size >= MAX_FOCUS) return [...focus];
      focus.add(project.slug);
    }
  }
  return [...focus];
}
