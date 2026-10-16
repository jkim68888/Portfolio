import Image from "next/image";
import Link from "next/link";
import { TagList } from "@/components/tag-list";
import type { Project } from "@/lib/projects";

const SIDE_LABELS: Record<string, string> = { "swift-side": "Swift", "rn-side": "React Native" };

// 한 줄에 하나씩 가로로 긴 카드. 왼쪽은 설명, 오른쪽은 대표 화면 하나를 작게 보여준다.
export function ProjectCard({ project }: { project: Project }) {
  const subtitle = project.company || `${SIDE_LABELS[project.category] ?? ""} 사이드 프로젝트`;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group focus-visible:outline-accent flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-8 sm:p-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            {subtitle} · {project.period}
          </p>
          <h3 className="group-hover:text-accent mt-1 text-lg font-bold transition-colors sm:text-xl">
            {project.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 sm:text-base">{project.summary || project.tagline}</p>
        </div>
        <TagList items={project.stack} label={`${project.title} 사용 기술`} />
      </div>
      {project.preview && (
        // 휴대폰·웹 화면이 섞여 있어 같은 세로형 틀에 위쪽 기준으로 맞춘다.
        <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 sm:w-28">
          <Image
            src={project.preview}
            alt=""
            fill
            sizes="112px"
            className="object-cover object-top transition duration-300 group-hover:scale-[1.04]"
          />
        </div>
      )}
    </Link>
  );
}
