import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureGallery } from "@/components/feature-gallery";
import { MarkdownContent } from "@/components/markdown";
import { RetroAccordion } from "@/components/retro-accordion";
import { TagList } from "@/components/tag-list";
import { splitFeatures, splitRetrospective, splitSections, type Section } from "@/lib/project-sections";
import { CATEGORY_LABELS, getProject, getProjects, type Project } from "@/lib/projects";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

// 상세 페이지는 모두 빌드 때 정적으로 만들어지므로 Suspense 자리표시 없이 한 번에 보낸다.
// Suspense로 스트리밍하면 없는 프로젝트 주소도 200으로 응답하게 되어, 404를 지키기 위해 이 방식을 쓴다.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return project ? { title: `${project.title} | 김지현 포트폴리오`, description: project.summary } : {};
}

function DetailSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="border-l-accent mb-5 border-l-4 pl-3 text-xl font-bold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SectionBody({ section, project }: { section: Section; project: Project }) {
  if (section.kind === "features") {
    const { lead, items } = splitFeatures(section.content);
    return (
      <>
        {lead && <MarkdownContent content={lead} imageSizes={project.imageSizes} className="mb-6" />}
        <FeatureGallery items={items} imageSizes={project.imageSizes} />
      </>
    );
  }
  if (section.kind === "retrospective") {
    const { lead, items } = splitRetrospective(section.content);
    return (
      <>
        {lead && <MarkdownContent content={lead} imageSizes={project.imageSizes} className="mb-6" />}
        {items.length > 0 && <RetroAccordion items={items} imageSizes={project.imageSizes} />}
      </>
    );
  }
  return <MarkdownContent content={section.content} imageSizes={project.imageSizes} />;
}

// 소개(📱)는 상단 요약과 겹치므로 본문 섹션에서 뺀다.
const SECTION_ORDER: Section["kind"][] = ["stack", "development", "retrospective", "other", "features"];

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const sections = splitSections(project.body)
    .filter((section) => section.kind !== "intro")
    .sort((a, b) => SECTION_ORDER.indexOf(a.kind) - SECTION_ORDER.indexOf(b.kind));

  // 회사 프로젝트는 홈의 경력 섹션에서, 사이드 프로젝트는 프로젝트 섹션에서 들어오므로 그곳으로 돌아간다.
  const back =
    project.category === "company"
      ? { href: "/#experience", label: "경력" }
      : { href: "/#projects", label: "사이드 프로젝트" };
  const cover = project.thumbnail ? project.imageSizes[project.thumbnail] : undefined;

  const facts = [
    { label: "기간", value: project.period },
    { label: "소속", value: project.company || CATEGORY_LABELS[project.category] },
    { label: "팀 구성", value: project.team },
    { label: "담당 역할", value: project.myRole },
  ].filter((fact) => fact.value);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-6">
      <Link href={back.href} className="hover:text-accent text-sm font-medium text-zinc-500 transition-colors">
        ← {back.label}
      </Link>

      <header className="mt-6">
        <p className="text-accent inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
          <span aria-hidden className="bg-accent size-1.5 rounded-full" />
          {CATEGORY_LABELS[project.category]}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
        <p className="mt-3 text-lg text-zinc-600">{project.summary || project.tagline}</p>
        <div className="mt-5">
          <TagList items={project.stack} label="사용 기술" size="md" tone="accent" />
        </div>
        {project.links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:bg-accent-soft rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
        {project.status && (
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">현재 상태</span> · {project.status}
          </p>
        )}
      </header>

      {cover && (
        // 배너는 가로로 매우 길어서, 좁은 화면에서는 높이를 유지하고 가로로 넘겨 보게 한다.
        <div className="bg-accent-soft mt-10 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <Image
            src={project.thumbnail}
            alt={`${project.title} 대표 화면`}
            width={cover.width}
            height={cover.height}
            priority
            sizes="(min-width: 1024px) 976px, 100vw"
            className="h-56 w-auto max-w-none sm:h-auto sm:w-full sm:max-w-full"
          />
        </div>
      )}

      <dl className="mt-10 grid gap-x-8 gap-y-5 rounded-2xl bg-gray-100 p-6 sm:grid-cols-[auto_1fr]">
        {facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-sm font-semibold text-gray-600">{fact.label}</dt>
            <dd className="-mt-4 text-sm leading-relaxed text-gray-800 sm:mt-0">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {sections.map((section, index) => (
        <DetailSection key={`${section.kind}-${index}`} id={`section-${index}`} title={section.title}>
          <SectionBody section={section} project={project} />
        </DetailSection>
      ))}
    </main>
  );
}
