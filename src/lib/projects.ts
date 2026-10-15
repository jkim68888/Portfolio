import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

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
  links: z.array(z.object({ label: z.string(), url: z.url() })),
  notionId: z.string(),
  // 챗봇 답변용 정보. 화면에는 노출하지 않는다.
  team: z.string(),
  myRole: z.string(),
  interviewQA: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export type ProjectMeta = z.infer<typeof projectSchema>;
export type Project = ProjectMeta & { body: string };

async function readProject(fileName: string): Promise<Project> {
  const source = await readFile(path.join(PROJECTS_DIR, fileName), "utf8");
  const { data, content } = matter(source);
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`content/projects/${fileName} 형식 오류\n${z.prettifyError(parsed.error)}`);
  }
  // 이미지 자리표시 같은 HTML 주석은 화면·챗봇 모두에 필요 없으므로 제거한다.
  const body = content.replace(/<!--[\s\S]*?-->\n?/g, "").trim();
  return { ...parsed.data, body };
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("max");
  const files = (await readdir(PROJECTS_DIR)).filter((file) => file.endsWith(".md"));
  const projects = await Promise.all(files.map(readProject));
  return projects.sort((a, b) => a.order - b.order);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
}
