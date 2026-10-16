import Image from "next/image";
import { ProjectCard } from "@/components/project-card";
import { ProjectRow } from "@/components/project-row";
import { TagList } from "@/components/tag-list";
import { getProfile } from "@/lib/profile";
import { getProjects, periodStartValue } from "@/lib/projects";

// 첫 화면·강점은 여러 색으로 생기를 주고, 경력부터는 회색 계열로 통일해 차분하게 읽히게 한다.
const EYEBROW_TONES = {
  gray: "text-gray-500",
  pink: "text-pink-600",
} as const;

function SectionHeading({
  id,
  eyebrow,
  title,
  tone,
}: {
  id: string;
  eyebrow: string;
  title: string;
  tone: keyof typeof EYEBROW_TONES;
}) {
  return (
    <div className="mb-8">
      <p className={`text-sm font-semibold tracking-wide uppercase ${EYEBROW_TONES[tone]}`}>{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

const STRENGTH_STYLES = [
  { card: "border-violet-200/70 from-violet-50", number: "text-violet-500" },
  { card: "border-sky-200/70 from-sky-50", number: "text-sky-500" },
  { card: "border-amber-200/70 from-amber-50", number: "text-amber-500" },
];

export default async function Home() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);
  // 회사 프로젝트는 경력 섹션에서만, 사이드 프로젝트는 프로젝트 섹션에서만 보여준다.
  const projectsBySlug = new Map(projects.map((project) => [project.slug, project]));
  const sideProjects = projects
    .filter((project) => project.category !== "company")
    .sort((a, b) => periodStartValue(b.period) - periodStartValue(a.period));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <section
        id="about"
        aria-labelledby="about-title"
        className="relative flex flex-col-reverse gap-10 py-16 sm:py-24 md:flex-row md:items-center"
      >
        {/* 장식용 색 번짐. 레이아웃에는 영향을 주지 않는다. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-10 right-0 size-72 rounded-full bg-pink-300/30 blur-3xl" />
          <div className="absolute top-24 right-40 size-60 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="absolute bottom-0 left-10 size-56 rounded-full bg-amber-200/40 blur-3xl" />
        </div>
        <div className="flex-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200">
            <span aria-hidden className="size-1.5 rounded-full bg-pink-500" />
            {profile.role} {profile.name}
          </p>
          <h1 id="about-title" className="mt-4 pb-1 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {profile.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">{profile.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition hover:brightness-110"
            >
              이메일 보내기
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-violet-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              GitHub
            </a>
          </div>
        </div>
        <Image
          src="/avatar.png"
          alt={`${profile.name} 아바타`}
          width={220}
          height={244}
          priority
          className="h-auto w-32 self-start rounded-3xl bg-gray-100 p-3 shadow-xl ring-1 shadow-gray-900/10 ring-white sm:w-40 md:w-48 md:self-auto"
        />
      </section>

      <section id="strengths" aria-labelledby="strengths-title" className="py-12">
        <SectionHeading id="strengths" eyebrow="Strengths" title="이런 개발자예요" tone="pink" />
        <ul className="grid gap-4 md:grid-cols-3">
          {profile.strengths.map((strength, index) => {
            const style = STRENGTH_STYLES[index % STRENGTH_STYLES.length];
            return (
              <li key={strength.title} className={`rounded-2xl border bg-gradient-to-b to-white p-6 ${style.card}`}>
                <p className={`text-sm font-bold tabular-nums ${style.number}`}>{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 font-bold">{strength.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{strength.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="experience" aria-labelledby="experience-title" className="py-12">
        <SectionHeading id="experience" eyebrow="Experience" title="경력" tone="gray" />
        <ol className="space-y-5">
          {profile.careers.map((career) => {
            const careerProjects = career.projects
              .map((slug) => projectsBySlug.get(slug))
              .filter((project) => project !== undefined);
            return (
              <li
                key={career.company}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-sm"
              >
                <div className="bg-accent-soft flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
                  <div className="flex items-baseline gap-2">
                    <span aria-hidden className="bg-accent size-2.5 self-center rounded-full" />
                    <h3 className="text-accent text-lg font-bold">{career.company}</h3>
                    <p className="text-sm text-zinc-600">{career.role}</p>
                  </div>
                  <p className="text-sm text-zinc-600 tabular-nums">{career.period}</p>
                </div>
                <ul className="divide-y divide-zinc-100 border-t border-gray-200">
                  {careerProjects.map((project) => (
                    <li key={project.slug}>
                      <ProjectRow project={project} />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="skills" aria-labelledby="skills-title" className="py-12">
        <SectionHeading id="skills" eyebrow="Skills" title="기술 스택" tone="gray" />
        <dl className="space-y-5">
          {profile.skills.map((skill) => (
            <div key={skill.group} className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <dt className="w-20 shrink-0 text-sm font-semibold text-zinc-500">{skill.group}</dt>
              <dd>
                <TagList items={skill.items} label={`${skill.group} 기술`} size="md" tone="accent" />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="projects" aria-labelledby="projects-title" className="py-12 pb-24">
        <SectionHeading id="projects" eyebrow="Side Projects" title="사이드 프로젝트" tone="gray" />
        <div className="flex flex-col gap-4">
          {sideProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}
