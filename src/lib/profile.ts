import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { contentCacheLife } from "./content-cache";

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
  contentCacheLife();
  const source = await readFile(path.join(process.cwd(), "content/profile.md"), "utf8");
  const { data, content } = matter(source);
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) throw new Error(`content/profile.md 형식 오류\n${z.prettifyError(parsed.error)}`);
  return { ...parsed.data, intro: content.trim() };
}
