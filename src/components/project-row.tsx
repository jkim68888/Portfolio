import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";

// 경력 카드 안에서 회사 프로젝트를 한 줄씩 보여주는 컴팩트한 행.
export function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group hover:bg-blue-50 focus-visible:bg-accent-soft flex items-center gap-4 px-5 py-4 transition-colors focus-visible:outline-none sm:px-6"
    >
      {project.preview && (
        <div className="bg-accent-soft relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 sm:w-14">
          <Image src={project.preview} alt="" fill sizes="56px" className="object-cover object-top" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h4 className="group-hover:text-accent font-semibold transition-colors">{project.title}</h4>
          <span className="text-xs text-zinc-500 tabular-nums">{project.period}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-zinc-600">{project.summary || project.tagline}</p>
        <p className="text-accent mt-1 hidden text-xs font-medium sm:block">{project.stack.join(" · ")}</p>
      </div>
      <span aria-hidden className="group-hover:text-accent text-zinc-300 transition group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
