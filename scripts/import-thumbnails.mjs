// 직접 만든 프로젝트 대표 이미지(배너)를 가져와 각 프로젝트의 thumbnail로 지정한다.
// 사용법: node scripts/import-thumbnails.mjs <thumbnails 폴더>
// 파일 이름(확장자 제외)이 프로젝트 slug와 같아야 한다. 다른 이름은 ALIASES로 연결한다.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ALIASES = { pp: "pipi", hybridapp: "hybrid-app" };
const MAX_HEIGHT = 900;

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) throw new Error("thumbnails 폴더 경로를 인자로 넘겨 주세요.");

  const files = (await readdir(sourceDir)).filter((file) => /\.(png|jpe?g)$/i.test(file));
  for (const file of files) {
    const name = path.parse(file).name;
    const slug = ALIASES[name] ?? name;
    const projectFile = path.resolve("content/projects", `${slug}.md`);
    const source = await readFile(projectFile, "utf8").catch(() => undefined);
    if (!source) {
      console.log(`- ${file}: 같은 이름의 프로젝트가 없어서 건너뜀`);
      continue;
    }

    const outDir = path.resolve("public/projects", slug);
    await mkdir(outDir, { recursive: true });
    const target = path.join(outDir, "cover.tmp.jpg");
    // 원본은 가로 최대 9000px 수준이라, 높이를 줄이고 JPG로 바꿔 용량을 줄인다.
    execFileSync(
      "sips",
      [
        "--resampleHeight",
        String(MAX_HEIGHT),
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        "85",
        path.join(sourceDir, file),
        "--out",
        target,
      ],
      { stdio: "ignore" },
    );

    // 같은 주소를 재사용하면 이미지 최적화 캐시·브라우저 캐시에 예전 이미지가 남으므로, 내용 해시를 파일명에 넣는다.
    const hash = createHash("md5")
      .update(await readFile(target))
      .digest("hex")
      .slice(0, 8);
    const fileName = `cover-${hash}.jpg`;
    for (const old of (await readdir(outDir)).filter(
      (name) => /^cover(-[0-9a-f]+)?\.jpg$/.test(name) && name !== fileName,
    )) {
      await rm(path.join(outDir, old));
    }
    await rename(target, path.join(outDir, fileName));

    await writeFile(projectFile, source.replace(/^thumbnail: ".*"$/m, `thumbnail: "/projects/${slug}/${fileName}"`));
    console.log(`✓ ${slug}: ${file} → ${fileName}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
