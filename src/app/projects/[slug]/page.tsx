import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getProject, getProjects } from "@/lib/projects";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return project ? { title: `${project.title} | 김지현 포트폴리오`, description: project.summary } : {};
}

// D1 임시 화면: 본문 렌더링 확인용. D4에 디자인을 입힌다.
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{project.title}</h1>
      {project.company && <p className="mt-1 text-sm text-gray-500">{project.company}</p>}
      <article className="prose prose-neutral mt-8 max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{project.body}</Markdown>
      </article>
    </main>
  );
}
