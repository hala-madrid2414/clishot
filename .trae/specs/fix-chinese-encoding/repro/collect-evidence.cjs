const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createCanvas } = require("@napi-rs/canvas");

const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
const distTypographyPath = path.join(repoRoot, "dist", "render", "typography.js");
const { ensureFontReady } = require(distTypographyPath);

const samplesDir = path.join(__dirname, "samples");
const evidencePath = path.join(__dirname, "evidence.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeSamples() {
  ensureDir(samplesDir);

  const correctText = "中文测试\n";
  const mojibakeLiteral = Buffer.from(correctText, "utf8").toString("latin1");
  const utf16leWithBom = Buffer.concat([
    Buffer.from([0xff, 0xfe]),
    Buffer.from(correctText, "utf16le")
  ]);

  fs.writeFileSync(path.join(samplesDir, "utf8-good.txt"), correctText, "utf8");
  fs.writeFileSync(path.join(samplesDir, "mojibake-literal.txt"), mojibakeLiteral, "utf8");
  fs.writeFileSync(path.join(samplesDir, "utf16le-bom.txt"), utf16leWithBom);
  fs.writeFileSync(path.join(samplesDir, "font-missing.txt"), correctText, "utf8");
}

function describeString(value) {
  return {
    text: value,
    escaped: JSON.stringify(value),
    codePoints: Array.from(value, (ch) => `U+${(ch.codePointAt(0) || 0).toString(16).toUpperCase()}`)
  };
}

function sha1(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

async function collectGlyphEvidence() {
  const typography = await ensureFontReady();
  const glyphs = ["中", "文", "测", "□", "?", "\uFFFD", "", "A"];
  const hashes = {};

  for (const glyph of glyphs) {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#000000";
    ctx.font = `32px ${typography.fontFamilyCss}`;
    ctx.textBaseline = "top";
    ctx.fillText(glyph, 4, 4);

    const pixels = Buffer.from(ctx.getImageData(0, 0, 64, 64).data);
    hashes[glyph] = sha1(pixels);
  }

  return {
    fontFamilyCss: typography.fontFamilyCss,
    glyphHashes: hashes,
    chineseGlyphsCollapseToSameHash:
      hashes["中"] === hashes["文"] && hashes["文"] === hashes["测"],
    chineseGlyphMatchesBox:
      hashes["中"] === hashes["□"] && hashes["文"] === hashes["□"] && hashes["测"] === hashes["□"],
    chineseGlyphMatchesQuestionMark:
      hashes["中"] === hashes["?"] && hashes["文"] === hashes["?"] && hashes["测"] === hashes["?"],
    chineseGlyphMatchesReplacementChar:
      hashes["中"] === hashes["\uFFFD"] &&
      hashes["文"] === hashes["\uFFFD"] &&
      hashes["测"] === hashes["\uFFFD"],
    chineseGlyphMatchesBlank:
      hashes["中"] === hashes[""] && hashes["文"] === hashes[""] && hashes["测"] === hashes[""]
  };
}

async function main() {
  writeSamples();

  const utf8GoodPath = path.join(samplesDir, "utf8-good.txt");
  const mojibakePath = path.join(samplesDir, "mojibake-literal.txt");
  const utf16lePath = path.join(samplesDir, "utf16le-bom.txt");

  const utf8Good = fs.readFileSync(utf8GoodPath, "utf8");
  const mojibakeLiteral = fs.readFileSync(mojibakePath, "utf8");
  const utf16Bytes = fs.readFileSync(utf16lePath);
  const utf16MisreadAsUtf8 = utf16Bytes.toString("utf8");
  const glyphEvidence = await collectGlyphEvidence();

  const evidence = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    samplesDir,
    cases: {
      upstreamMojibake: {
        sample: "samples/mojibake-literal.txt",
        expectedRootCause: "输入已乱码",
        note: "文件内容本身已是错误字符，后续无论按 UTF-8 还是渲染图片都只能保留错误文本。",
        correctReference: describeString("中文测试\n"),
        observed: describeString(mojibakeLiteral)
      },
      decodeMismatch: {
        sample: "samples/utf16le-bom.txt",
        expectedRootCause: "读取编码错误",
        note: "Windows PowerShell 5 常见重定向文件为 UTF-16LE，当前实现固定按 UTF-8 读取。",
        observedWhenForcedUtf8: describeString(utf16MisreadAsUtf8)
      },
      missingGlyphs: {
        sample: "samples/font-missing.txt",
        expectedRootCause: "字体缺失",
        note: "对多个中文字符单独栅格化后得到相同图像哈希，说明当前字体链没有为这些字符提供可区分的中文字形。",
        ...glyphEvidence
      }
    }
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + "\n", "utf8");
  process.stdout.write(`${evidencePath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
