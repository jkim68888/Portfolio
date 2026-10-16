import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { imageSize } from "image-size";
import { z } from "zod";
import { contentCacheLife } from "./content-cache";
import { collectImageSources } from "./project-sections";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export const CATEGORY_LABELS = {
  company: "회사 프로젝트",
  "swift-side": "Swift 사이드 프로젝트",
  "rn-side": "React Native 사이드 프로젝트",
} as const;

const projectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  category: z.enum(Object.keys(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS]),
  company: z.string(),
  period: z.string(),
  tagline: z.string(),
  summary: z.string(),
  stack: z.array(z.string()),
  thumbnail: z.string(),
  // 목록 카드에 작게 보이는 대표 화면 (thumbnail은 상세 페이지 상단 배너)
  preview: z.string().default(""),
  links: z.array(z.object({ label: z.string(), url: z.url() })),
  // 서비스 종료·미출시처럼 링크가 없는 이유 등 현재 상태. 화면과 챗봇 모두 사용한다.
  status: z.string().default(""),
  notionId: z.string(),
  // team·myRole은 상세 페이지와 챗봇에, interviewQA는 챗봇에만 쓴다.
  team: z.string(),
  myRole: z.string(),
  interviewQA: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export type ProjectMeta = z.infer<typeof projectSchema>;
export type ImageSize = { width: number; height: number };
export type Project = ProjectMeta & { body: string; imageSizes: Record<string, ImageSize> };

async function readProject(fileName: string): Promise<Project> {
  const source = await readFile(path.join(PROJECTS_DIR, fileName), "utf8");
  const { data, content } = matter(source);
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`content/projects/${fileName} 형식 오류\n${z.prettifyError(parsed.error)}`);
  }
  // 이미지 자리표시 같은 HTML 주석은 화면·챗봇 모두에 필요 없으므로 제거한다.
  const body = content.replace(/<!--[\s\S]*?-->\n?/g, "").trim();

  // next/image에 넘길 크기를 빌드 시점에 미리 구해 둔다.
  const sources = [
    ...new Set([...collectImageSources(body), parsed.data.thumbnail, parsed.data.preview].filter(Boolean)),
  ];
  const imageSizes = Object.fromEntries(
    await Promise.all(
      sources.map(async (src) => {
        const { width, height } = imageSize(await readFile(path.join(process.cwd(), "public", src)));
        return [src, { width, height }] as const;
      }),
    ),
  );

  return { ...parsed.data, body, imageSizes };
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  contentCacheLife();
  const files = (await readdir(PROJECTS_DIR)).filter((file) => file.endsWith(".md"));
  const projects = await Promise.all(files.map(readProject));
  return projects.sort((a, b) => a.order - b.order);
}

// "2024.04.01 ~ 2024.06.20", "2025.12 ~ 2026.10"처럼 형식이 섞인 기간에서 시작일을 정렬용 숫자로 만든다.
export function periodStartValue(period: string) {
  const [year = 0, month = 0, day = 0] = (period.split("~")[0].match(/\d+/g) ?? []).map(Number);
  return year * 10000 + month * 100 + day;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
}
