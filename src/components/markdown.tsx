import Image from "next/image";
import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { ImageSize } from "@/lib/projects";

type MarkdownContentProps = {
  content: string;
  imageSizes?: Record<string, ImageSize>;
  className?: string;
};

export function MarkdownContent({ content, imageSizes = {}, className = "" }: MarkdownContentProps) {
  const components: Components = {
    img: ({ src, alt }) => {
      const size = typeof src === "string" ? imageSizes[src] : undefined;
      if (typeof src !== "string" || !size) return null;
      return (
        <Image
          src={src}
          alt={alt ?? ""}
          width={size.width}
          height={size.height}
          sizes="(min-width: 768px) 360px, 80vw"
          className="my-4 max-h-[480px] w-auto rounded-xl border border-gray-200"
        />
      );
    },
    a: ({ href, children }) => {
      const external = href?.startsWith("http");
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    // 표가 화면보다 넓을 때 페이지 전체가 아니라 표만 가로로 스크롤되게 한다.
    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
  };

  return (
    <div
      className={`prose prose-zinc prose-headings:font-bold prose-a:text-accent prose-blockquote:border-l-gray-300 prose-li:marker:text-gray-400 prose-blockquote:font-normal prose-blockquote:text-zinc-700 prose-blockquote:not-italic prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto max-w-none [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none ${className}`}
    >
      {/* Notion에서 블록 안 줄바꿈을 그대로 살리려고 remark-breaks를 쓴다. */}
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
