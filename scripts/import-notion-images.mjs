// Notion "Markdown & CSV" 내보내기에서 이미지를 가져와 content/projects/*.md의 자리표시를 채운다.
// 사용법: node scripts/import-notion-images.mjs <내보내기 폴더("포트폴리오 - 김지현"의 상위 폴더)>
// 내보내기 마크다운의 이미지 순서와 notion-export.mjs가 남긴 <!-- IMAGE --> 자리표시 순서가 같다는 점을 이용한다.
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_WIDTH = 900;

// notionId(하이픈 제거)로 내보내기 파일을 찾는다.
const PROJECTS = [
  "modoo-ipsi-ai",
  "picaloca",
  "saving-hanaro",
  "vortex-gaming",
  "pipi",
  "modoo-subway",
  "todolist",
  "checkit",
];

async function findFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? findFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    ),
  );
  return nested.flat();
}

function imageWidth(file) {
  const output = execFileSync("sips", ["-g", "pixelWidth", file], { encoding: "utf8" });
  return Number(output.match(/pixelWidth: (\d+)/)?.[1] ?? 0);
}

// 이미지 바로 아래 목록 항목이 화면 설명이라 alt로 쓰고, 없으면 "프로젝트명 화면 N"으로 둔다.
function altFor(lines, index, title, order) {
  for (const line of lines.slice(index + 1, index + 3)) {
    const match = line.match(/^\s*-\s+(.+)/);
    if (match) return match[1].replace(/[*`[\]]/g, "").trim();
    if (line.trim() && !line.includes("<!-- IMAGE")) break;
  }
  return `${title} 화면 ${order}`;
}

async function main() {
  const exportRoot = process.argv[2];
  if (!exportRoot) throw new Error("내보내기 폴더 경로를 인자로 넘겨 주세요.");
  const exportFiles = (await findFiles(path.resolve(exportRoot))).filter((file) => file.endsWith(".md"));

  for (const slug of PROJECTS) {
    const projectFile = path.resolve("content/projects", `${slug}.md`);
    const source = await readFile(projectFile, "utf8");
    const notionId = source.match(/^notionId: "([^"]+)"/m)[1].replaceAll("-", "");
    const title = source.match(/^title: "([^"]+)"/m)[1];
    const exportFile = exportFiles.find((file) => file.endsWith(`${notionId}.md`));
    if (!exportFile) throw new Error(`${slug}: 내보내기 파일을 찾지 못함`);

    const exportMd = await readFile(exportFile, "utf8");
    // 파일명에 괄호가 들어갈 수 있어서 확장자까지를 경로로 본다.
    const images = [...exportMd.matchAll(/!\[[^\]]*\]\((.+?\.(?:png|jpe?g|gif|webp))\)/gi)].map((match) =>
      path.join(path.dirname(exportFile), decodeURIComponent(match[1])),
    );

    const outDir = path.resolve("public/projects", slug);
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const lines = source.split("\n");
    let order = 0;
    let thumbnail = "";
    let fallbackThumbnail = "";
    let inFeatures = false;
    for (const [index, line] of lines.entries()) {
      if (line.startsWith("### ")) inFeatures = line.includes("📌");
      if (!line.includes("<!-- IMAGE")) continue;
      const image = images[order];
      order += 1;
      if (!image) throw new Error(`${slug}: 자리표시가 이미지보다 많음`);

      const ext = path.extname(image).toLowerCase().replace(".jpeg", ".jpg");
      const fileName = `${String(order).padStart(2, "0")}${ext}`;
      const target = path.join(outDir, fileName);
      await copyFile(image, target);
      // 휴대폰 원본 스크린샷은 너무 커서 화면 표시용 폭으로 줄인다.
      if (imageWidth(target) > MAX_WIDTH)
        execFileSync("sips", ["--resampleWidth", String(MAX_WIDTH), target], { stdio: "ignore" });

      const src = `/projects/${slug}/${fileName}`;
      // 카드 썸네일은 "주요 기능"의 첫 화면을 쓴다. 회고 속 그래프 같은 이미지가 대표 이미지가 되지 않게 한다.
      if (inFeatures) thumbnail ||= src;
      fallbackThumbnail ||= src;
      const indent = line.match(/^\s*/)[0];
      lines[index] = `${indent}![${altFor(lines, index, title, order)}](${src})`;
    }
    if (order !== images.length)
      throw new Error(`${slug}: 자리표시 ${order}개, 이미지 ${images.length}개로 개수가 다름`);

    const updated = lines.join("\n").replace(/^thumbnail: ".*"$/m, `thumbnail: "${thumbnail || fallbackThumbnail}"`);
    await writeFile(projectFile, updated);
    console.log(`✓ ${slug}: 이미지 ${order}개`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
