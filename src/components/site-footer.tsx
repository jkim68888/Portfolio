import { getProfile } from "@/lib/profile";

export async function SiteFooter() {
  const profile = await getProfile();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 {profile.name}</p>
        <div className="flex gap-4">
          <a href={`mailto:${profile.email}`} className="hover:text-zinc-900">
            {profile.email}
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-zinc-900">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
