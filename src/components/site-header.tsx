import Link from "next/link";

const NAV_ITEMS = [
  { href: "/#about", label: "소개" },
  { href: "/#experience", label: "경력" },
  { href: "/#projects", label: "프로젝트" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-bold tracking-tight">
          김지현
        </Link>
        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 text-sm font-medium text-zinc-600">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
