// scripts/og-image.svg를 링크 미리보기용 PNG(src/app/opengraph-image.png)로 변환한다.
// 사용법: npm run og:build
// SNS 미리보기는 og:image로 SVG를 지원하지 않아 SVG를 원본으로 두고 PNG를 만들어 커밋한다.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SVG_FILE = path.resolve("scripts/og-image.svg");
const AVATAR_FILE = path.resolve("public/avatar.png");
const FONT_DIR = path.resolve("node_modules/pretendard/dist/public/static");
const OUT_FILE = path.resolve("src/app/opengraph-image.png");

async function main() {
  // Pretendard가 시스템에 설치되어 있지 않아도 SVG 글꼴로 쓰이도록 fontconfig에 폴더를 알려 준다.
  // sharp가 글꼴 설정을 읽기 전에 지정해야 하므로 sharp는 그 뒤에 불러온다.
  const fontConfigDir = await mkdtemp(path.join(tmpdir(), "og-fontconfig-"));
  const fontConfigFile = path.join(fontConfigDir, "fonts.conf");
  await writeFile(
    fontConfigFile,
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig><dir>${FONT_DIR}</dir><cachedir>${fontConfigDir}</cachedir></fontconfig>\n`,
  );
  process.env.FONTCONFIG_FILE = fontConfigFile;
  const { default: sharp } = await import("sharp");

  try {
    const avatar = (await readFile(AVATAR_FILE)).toString("base64");
    const svg = (await readFile(SVG_FILE, "utf8")).replace(
      'href="avatar.png"',
      `href="data:image/png;base64,${avatar}"`,
    );
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT_FILE);
    console.log(`생성: ${path.relative(process.cwd(), OUT_FILE)}`);
  } finally {
    await rm(fontConfigDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
