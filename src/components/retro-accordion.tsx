import { MarkdownContent } from "@/components/markdown";
import type { RetroItem } from "@/lib/project-sections";
import type { ImageSize } from "@/lib/projects";

type RetroAccordionProps = { items: RetroItem[]; imageSizes: Record<string, ImageSize> };

// 회고는 항목이 많고 길어서 제목만 먼저 보여주고, 펼쳐서 읽게 한다. (<details>라 JS 없이 키보드로도 동작)
export function RetroAccordion({ items, imageSizes }: RetroAccordionProps) {
  return (
    <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200">
      {items.map((item, index) => (
        <details key={item.title} open={index === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
            {item.title}
            <span aria-hidden className="text-zinc-400 transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="px-5 pb-6">
            <MarkdownContent content={item.content} imageSizes={imageSizes} />
          </div>
        </details>
      ))}
    </div>
  );
}
