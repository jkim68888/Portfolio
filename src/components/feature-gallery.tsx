import Image from "next/image";
import { MarkdownContent } from "@/components/markdown";
import type { FeatureItem } from "@/lib/project-sections";
import type { ImageSize } from "@/lib/projects";

type FeatureGalleryProps = { items: FeatureItem[]; imageSizes: Record<string, ImageSize> };

export function FeatureGallery({ items, imageSizes }: FeatureGalleryProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => {
        const size = item.image ? imageSizes[item.image.src] : undefined;
        // 웹 화면처럼 가로로 긴 스크린샷은 두 칸을 차지하게 한다.
        const wide = size ? size.width > size.height : false;
        return (
          <li key={item.image?.src ?? index} className={wide ? "col-span-2" : undefined}>
            <figure>
              {item.image && size && (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={size.width}
                  height={size.height}
                  sizes={wide ? "(min-width: 1024px) 460px, 90vw" : "(min-width: 1024px) 220px, 45vw"}
                  className="bg-accent-soft w-full rounded-xl border border-gray-200 shadow-sm"
                />
              )}
              {item.content && (
                <figcaption className="mt-3">
                  <MarkdownContent content={item.content} className="prose-sm prose-ul:my-0 prose-li:my-0.5" />
                </figcaption>
              )}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
