// Notion 공개 페이지의 프로젝트 본문을 마크다운 초안으로 추출한다.
// 사용법: node scripts/notion-export.mjs [--force]
// 이미 있는 파일은 손으로 다듬은 내용일 수 있으므로 --force 없이는 덮어쓰지 않는다.
// 이미지는 Notion이 외부 다운로드를 막아서 자리표시(HTML 주석)만 남긴다.
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE = "https://succulent-beard-d2d.notion.site/api/v3";
const SPACE_ID = "6ee78f61-79a9-4d2d-8992-3e420610387e";

const PROJECTS = [
  { slug: "modoo-ipsi-ai", id: "33133aa8-a192-8061-b574-fdfe6beeefe6", category: "company", company: "(주)이노스피치" },
  { slug: "picaloca", id: "27633aa8-a192-8172-b262-c06168c1ddfd", category: "company", company: "(주)피카로카" },
  { slug: "saving-hanaro", id: "27633aa8-a192-8114-a8d1-edc9799b83bd", category: "company", company: "(주)피카로카" },
  { slug: "vortex-gaming", id: "27633aa8-a192-817c-aeae-fb1fef628628", category: "company", company: "(주)인벤" },
  { slug: "inven", id: "27633aa8-a192-815a-9632-d57de69dd0b4", category: "company", company: "(주)인벤" },
  { slug: "pipi", id: "27633aa8-a192-8161-bcaf-c384e565950c", category: "swift-side" },
  { slug: "modoo-subway", id: "27633aa8-a192-81cb-8b8b-cc71a3036a12", category: "swift-side" },
  { slug: "todolist", id: "27633aa8-a192-812a-851f-f09455bd5cc0", category: "swift-side" },
  { slug: "hybrid-app", id: "30b33aa8-a192-8079-967c-d7e254099182", category: "rn-side" },
  { slug: "checkit", id: "27633aa8-a192-816d-a55f-dfe131dee390", category: "rn-side" },
];

async function post(endpoint, body) {
  const res = await fetch(`${SITE}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${endpoint} ${res.status}`);
  return res.json();
}

// Notion 응답은 { value: { value: block } } 또는 { value: block } 형태가 섞여 있다.
const unwrap = (record) => record?.value?.value ?? record?.value;

async function loadPage(pageId) {
  const blocks = new Map();
  const collections = new Map();
  const add = (recordMap) => {
    for (const [id, record] of Object.entries(recordMap.block ?? {})) {
      const block = unwrap(record);
      if (block) blocks.set(id, block);
    }
    for (const [id, record] of Object.entries(recordMap.collection ?? {})) {
      const collection = unwrap(record);
      if (collection) collections.set(id, collection);
    }
  };

  const chunk = await post("loadCachedPageChunkV2", {
    page: { id: pageId },
    limit: 500,
    cursor: { stack: [] },
    verticalColumns: false,
  });
  add(chunk.recordMap);

  // 토글·컬럼 안쪽처럼 첫 응답에 없는 하위 블록을 모두 채운다.
  for (;;) {
    const missing = [...blocks.values()]
      .filter((block) => block.type !== "page" || block.id === pageId)
      .flatMap((block) => block.content ?? [])
      .filter((id) => !blocks.has(id));
    if (missing.length === 0) break;
    const synced = await post("syncRecordValuesMain", {
      requests: missing.map((id) => ({ pointer: { table: "block", id, spaceId: SPACE_ID }, version: -1 })),
    });
    const before = blocks.size;
    add(synced.recordMap);
    if (blocks.size === before) break;
  }
  return { blocks, collections };
}

// 마크다운에서 HTML 태그로 해석되지 않도록 꺾쇠를 이스케이프한다.
const escapeHtml = (text) => text.replace(/[<>]/g, (ch) => `\\${ch}`);

function richText(title, { plain = false } = {}) {
  if (!title) return "";
  return (
    title
      .map(([text, marks = []]) => {
        if (plain) return text;
        const isCode = marks.some(([mark]) => mark === "c");
        // 코드 안에서는 이스케이프가 그대로 보이므로, 코드가 아닐 때만 이스케이프한다.
        let out = isCode ? `\`${text}\`` : escapeHtml(text);
        for (const [mark, value] of marks) {
          if (mark === "b") out = `**${out}**`;
          else if (mark === "i") out = `*${out}*`;
          else if (mark === "s") out = `~~${out}~~`;
          else if (mark === "a") out = `[${out}](${value})`;
        }
        return out;
      })
      .join("")
      // 연속된 굵은 글씨 조각(**a****b**)을 하나로 합친다.
      .replace(/\*\*\*\*/g, "")
  );
}

function renderTable(block, blocks, indent) {
  const columns = block.format?.table_block_column_order ?? [];
  const rows = (block.content ?? []).map((id) => blocks.get(id)).filter(Boolean);
  const cell = (row, column) => richText(row.properties?.[column]).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const line = (row) => `${indent}| ${columns.map((column) => cell(row, column)).join(" | ")} |`;
  if (rows.length === 0) return [];
  const [head, ...rest] = rows;
  return ["", line(head), `${indent}| ${columns.map(() => "---").join(" | ")} |`, ...rest.map(line), ""];
}

function renderBlocks(ids, blocks, depth = 0) {
  const lines = [];
  const indent = "  ".repeat(depth);
  let numbered = 0;
  for (const id of ids ?? []) {
    const block = blocks.get(id);
    if (!block || block.alive === false) continue;
    const text = richText(block.properties?.title);
    const heading = richText(block.properties?.title, { plain: true }).trim();
    numbered = block.type === "numbered_list" ? numbered + 1 : 0;
    const children = () => renderBlocks(block.content, blocks, depth + 1);

    switch (block.type) {
      case "header":
        lines.push("", `## ${heading}`, "");
        break;
      case "sub_header":
        lines.push("", `### ${heading}`, "");
        break;
      case "sub_sub_header":
        lines.push("", `### ${heading}`, "");
        break;
      case "text":
        lines.push(text ? `${indent}${text}` : "");
        lines.push(...children());
        break;
      case "bulleted_list":
        lines.push(`${indent}- ${text}`, ...children());
        break;
      case "numbered_list":
        lines.push(`${indent}${numbered}. ${text}`, ...children());
        break;
      case "to_do":
        lines.push(`${indent}- [${block.properties?.checked?.[0]?.[0] === "Yes" ? "x" : " "}] ${text}`, ...children());
        break;
      case "toggle":
        lines.push("", `#### ${heading}`, "", ...renderBlocks(block.content, blocks, depth), "");
        break;
      case "callout":
      case "quote":
        if (text) lines.push(`${indent}> ${text}`);
        lines.push(...renderBlocks(block.content, blocks, depth).map((line) => (line ? `> ${line}` : ">")));
        lines.push("");
        break;
      case "table":
        lines.push(...renderTable(block, blocks, indent));
        break;
      case "code":
        lines.push(
          "```" + (block.properties?.language?.[0]?.[0] ?? "").toLowerCase(),
          richText(block.properties?.title, { plain: true }),
          "```",
        );
        break;
      case "divider":
        lines.push("", "---", "");
        break;
      case "image": {
        const caption =
          richText(block.properties?.caption, { plain: true }) ||
          richText(block.properties?.title, { plain: true }) ||
          "image";
        lines.push(`${indent}<!-- IMAGE: ${caption.replace(/--/g, "")} (block ${block.id}) -->`);
        break;
      }
      case "bookmark":
        lines.push(
          `${indent}- [${richText(block.properties?.title) || block.properties?.link?.[0]?.[0]}](${block.properties?.link?.[0]?.[0]})`,
        );
        break;
      case "column_list":
      case "column":
        lines.push(...renderBlocks(block.content, blocks, depth));
        break;
      case "page":
        lines.push(`${indent}- (하위 페이지) ${text}`);
        break;
      default:
        lines.push(`${indent}<!-- 미지원 블록: ${block.type} -->`);
    }
  }
  return lines;
}

function collectProperties(page, collections) {
  const schema = collections.get(page.parent_id)?.schema ?? {};
  const props = {};
  for (const [key, value] of Object.entries(page.properties ?? {})) {
    const name = schema[key]?.name ?? key;
    props[name] = value.map(([text]) => text).join("");
  }
  return props;
}

const yamlString = (value) => JSON.stringify(value ?? "");

// 첫 섹션("📱 한 줄 소개" 제목 + 설명 문단)에서 카드용 소개 문구를 뽑는다.
function extractIntro(page, blocks) {
  const [first, ...rest] = (page.content ?? []).map((id) => blocks.get(id)).filter(Boolean);
  const plain = (block) => richText(block?.properties?.title, { plain: true }).trim();
  const tagline = plain(first).replace(/^\p{Extended_Pictographic}\s*/u, "");
  const sectionEnd = rest.findIndex((block) => block.type.endsWith("header"));
  const section = sectionEnd === -1 ? rest : rest.slice(0, sectionEnd);
  const intro = section.find((block) => block.type === "text" && plain(block) && !/바로가기/.test(plain(block)));
  return { tagline, summary: plain(intro) };
}

// 본문에 있는 GitHub 저장소·조직 링크를 프로젝트 링크로 모은다.
function extractLinks(blocks) {
  const urls = new Set();
  const isGitHub = (url) => /^https:\/\/github\.com\/(jkim68888\/|team-)/.test(url ?? "");
  for (const block of blocks.values()) {
    const bookmark = block.type === "bookmark" ? block.properties?.link?.[0]?.[0] : undefined;
    if (isGitHub(bookmark)) urls.add(bookmark);
    for (const [, marks = []] of block.properties?.title ?? []) {
      for (const [mark, value] of marks) {
        if (mark === "a" && isGitHub(value)) urls.add(value);
      }
    }
  }
  return [...urls].map((url) => ({ label: "GitHub", url }));
}

const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );

async function main() {
  const force = process.argv.includes("--force");
  const outDir = path.resolve("content/projects");
  await mkdir(outDir, { recursive: true });

  for (const [index, project] of PROJECTS.entries()) {
    const file = path.join(outDir, `${project.slug}.md`);
    if (!force && (await exists(file))) {
      console.log(`- ${project.slug}: 이미 있어서 건너뜀 (--force로 덮어쓰기)`);
      continue;
    }

    const { blocks, collections } = await loadPage(project.id);
    const page = blocks.get(project.id);
    const props = collectProperties(page, collections);
    const stack = (props["사용 기술"] ?? "").split(",").filter(Boolean);
    const { tagline, summary } = extractIntro(page, blocks);
    const links = extractLinks(blocks);
    const body = renderBlocks(page.content, blocks)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const frontmatter = [
      "---",
      `title: ${yamlString(richText(page.properties?.title, { plain: true }))}`,
      `slug: ${yamlString(project.slug)}`,
      `order: ${index + 1}`,
      `category: ${yamlString(project.category)}`,
      `company: ${yamlString(project.company ?? "")}`,
      `period: ""`,
      `tagline: ${yamlString(tagline)}`,
      `summary: ${yamlString(summary)}`,
      `stack: ${JSON.stringify(stack)}`,
      `thumbnail: ""`,
      `links: ${JSON.stringify(links)}`,
      `notionId: ${yamlString(project.id)}`,
      "# 아래는 챗봇 답변용 정보 (화면에는 노출하지 않음)",
      `team: ""`,
      `myRole: ""`,
      `interviewQA: []`,
      "---",
    ].join("\n");

    await writeFile(file, `${frontmatter}\n\n${body}\n`);
    console.log(`✓ ${project.slug} (${blocks.size} blocks)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
