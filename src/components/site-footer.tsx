import { getProfile } from "@/lib/profile";

export async function SiteFooter() {
  const profile = await getProfile();

  return (
    <footer className="relative bg-zinc-950 text-zinc-400">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400"
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 {profile.name}</p>
        <div className="flex gap-4">
          <a href={`mailto:${profile.email}`} className="transition-colors hover:text-pink-300">
            {profile.email}
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" className="transition-colors hover:text-violet-300">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
