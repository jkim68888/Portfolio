import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string(),
  role: z.string(),
  email: z.email(),
  github: z.url(),
  headline: z.string(),
  strengths: z.array(z.object({ title: z.string(), description: z.string() })),
  careers: z.array(
    z.object({ company: z.string(), role: z.string(), period: z.string(), projects: z.array(z.string()) }),
  ),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
});

export type Profile = z.infer<typeof profileSchema> & { intro: string };

export async function getProfile(): Promise<Profile> {
  "use cache";
  // 배포본은 빌드 때 한 번 읽으면 충분하지만, 개발 중에는 content/*.md 수정이 바로 보이도록 캐시를 짧게 둔다.
  if (process.env.NODE_ENV === "development") cacheLife("seconds");
  else cacheLife("max");
  const source = await readFile(path.join(process.cwd(), "content/profile.md"), "utf8");
  const { data, content } = matter(source);
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) throw new Error(`content/profile.md 형식 오류\n${z.prettifyError(parsed.error)}`);
  return { ...parsed.data, intro: content.trim() };
}
