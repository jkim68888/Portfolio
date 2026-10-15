import Link from "next/link";
import { CATEGORY_LABELS, getProjects } from "@/lib/projects";

// D1 임시 화면: 콘텐츠 파이프라인 확인용. D3에 디자인을 입힌다.
export default async function Home() {
  const projects = await getProjects();
  const categories = Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">김지현 포트폴리오</h1>
      {categories.map(([category, label]) => (
        <section key={category} className="mt-10">
          <h2 className="text-lg font-semibold">{label}</h2>
          <ul className="mt-4 space-y-3">
            {projects
              .filter((project) => project.category === category)
              .map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}`} className="block rounded-lg border p-4 hover:bg-black/5">
                    <p className="font-medium">
                      {project.title} <span className="text-sm text-gray-500">{project.tagline}</span>
                    </p>
                    {project.summary && <p className="mt-1 text-sm text-gray-600">{project.summary}</p>}
                    <p className="mt-2 text-xs text-gray-500">{project.stack.join(" · ")}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
