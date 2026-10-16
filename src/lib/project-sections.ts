// 프로젝트 본문 마크다운을 상세 페이지 레이아웃에 맞게 섹션 단위로 나눈다.
// Notion 원본이 "### 📱 소개 / 🛠️ 사용 기술 / 👩‍💻 개발 사항 / 💡 회고 / 📌 주요 기능" 순서의 같은 틀을 쓴다는 점을 이용한다.

export type SectionKind = "intro" | "stack" | "development" | "retrospective" | "features" | "other";

export type Section = { kind: SectionKind; title: string; content: string };
export type RetroItem = { title: string; content: string };
export type FeatureItem = { image?: { alt: string; src: string }; content: string };

const KIND_BY_EMOJI: [string, SectionKind][] = [
  ["📱", "intro"],
  ["🛠", "stack"],
  ["👩‍💻", "development"],
  ["💡", "retrospective"],
  ["📌", "features"],
];

const IMAGE_LINE = /^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/;

// 상세 페이지 상단 버튼과 겹치는 GitHub 바로가기 줄, 섹션 사이 구분선은 뺀다.
function isNoise(line: string) {
  return (
    /깃허브/.test(line) || /^\s*-\s+\[[^\]]+\]\(https:\/\/github\.com\/[^)]+\)\s*$/.test(line) || line.trim() === "---"
  );
}

export function splitSections(body: string): Section[] {
  const sections: Section[] = [];
  let current: Section | undefined;
  let inFence = false;

  for (const line of body.split("\n")) {
    if (/^(>\s*)?```/.test(line.trimStart())) inFence = !inFence;
    const heading = !inFence && line.match(/^###\s+(.+)$/);
    if (heading) {
      const raw = heading[1].trim();
      const kind = KIND_BY_EMOJI.find(([emoji]) => raw.startsWith(emoji))?.[1] ?? "other";
      const title = raw
        .replace(/^[\p{Extended_Pictographic}️‍\s]+/u, "")
        .replace(/\s+/g, " ")
        .trim();
      current = { kind, title, content: "" };
      sections.push(current);
      continue;
    }
    if (!current || (!inFence && isNoise(line))) continue;
    current.content += `${line}\n`;
  }

  return sections.map((section) => ({ ...section, content: section.content.trim() })).filter((s) => s.content);
}

export function splitRetrospective(content: string): { lead: string; items: RetroItem[] } {
  const items: RetroItem[] = [];
  const lead: string[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^(>\s*)?```/.test(line.trimStart())) inFence = !inFence;
    const heading = !inFence && line.match(/^####\s+(.+)$/);
    if (heading) {
      items.push({ title: heading[1].trim(), content: "" });
    } else if (items.length > 0) {
      items[items.length - 1].content += `${line}\n`;
    } else {
      lead.push(line);
    }
  }
  return { lead: lead.join("\n").trim(), items: items.map((item) => ({ ...item, content: item.content.trim() })) };
}

// "이미지 + 바로 아래 설명 목록"을 하나의 카드로 묶는다.
export function splitFeatures(content: string): { lead: string; items: FeatureItem[] } {
  const items: FeatureItem[] = [];
  const lead: string[] = [];
  for (const line of content.split("\n")) {
    const image = line.match(IMAGE_LINE);
    if (image) {
      items.push({ image: { alt: image[1], src: image[2] }, content: "" });
    } else if (items.length > 0) {
      items[items.length - 1].content += `${line}\n`;
    } else {
      lead.push(line);
    }
  }
  return { lead: lead.join("\n").trim(), items: items.map((item) => ({ ...item, content: item.content.trim() })) };
}

export function collectImageSources(markdown: string) {
  return [...markdown.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)/g)].map((match) => match[1]);
}
