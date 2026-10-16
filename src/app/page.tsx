import Image from "next/image";
import { ProjectCard } from "@/components/project-card";
import { ProjectRow } from "@/components/project-row";
import { TagList } from "@/components/tag-list";
import { getProfile } from "@/lib/profile";
import { getProjects, periodStartValue } from "@/lib/projects";

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-accent text-sm font-semibold">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

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
        className="flex flex-col-reverse gap-10 py-16 sm:py-24 md:flex-row md:items-center"
      >
        <div className="flex-1">
          <p className="text-accent text-sm font-semibold">
            {profile.role} {profile.name}
          </p>
          <h1 id="about-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {profile.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">{profile.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              이메일 보내기
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-zinc-100"
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
          className="bg-accent-soft h-auto w-32 self-start rounded-3xl p-3 sm:w-40 md:w-48 md:self-auto"
        />
      </section>

      <section id="strengths" aria-labelledby="strengths-title" className="py-12">
        <SectionHeading id="strengths" eyebrow="Strengths" title="이런 개발자예요" />
        <ul className="grid gap-4 md:grid-cols-3">
          {profile.strengths.map((strength) => (
            <li key={strength.title} className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold">{strength.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{strength.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="experience" aria-labelledby="experience-title" className="py-12">
        <SectionHeading id="experience" eyebrow="Experience" title="경력" />
        <ol className="space-y-5">
          {profile.careers.map((career) => {
            const careerProjects = career.projects
              .map((slug) => projectsBySlug.get(slug))
              .filter((project) => project !== undefined);
            return (
              <li key={career.company} className="overflow-hidden rounded-2xl border border-zinc-200">
                <div className="flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-bold">{career.company}</h3>
                    <p className="text-sm text-zinc-500">{career.role}</p>
                  </div>
                  <p className="text-sm text-zinc-500 tabular-nums">{career.period}</p>
                </div>
                <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
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
        <SectionHeading id="skills" eyebrow="Skills" title="기술 스택" />
        <dl className="space-y-5">
          {profile.skills.map((skill) => (
            <div key={skill.group} className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <dt className="w-20 shrink-0 text-sm font-semibold text-zinc-500">{skill.group}</dt>
              <dd>
                <TagList items={skill.items} label={`${skill.group} 기술`} size="md" />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="projects" aria-labelledby="projects-title" className="py-12 pb-24">
        <SectionHeading id="projects" eyebrow="Side Projects" title="사이드 프로젝트" />
        <div className="flex flex-col gap-4">
          {sideProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}
