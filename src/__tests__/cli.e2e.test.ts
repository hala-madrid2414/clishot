import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createCanvas } from "@napi-rs/canvas";
import { ensureFontReady } from "../render/typography";

type CliRunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

function parsePngSize(buf: Buffer): { width: number; height: number } {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(buf.subarray(0, 8).equals(signature), true);
  const type = buf.subarray(12, 16).toString("ascii");
  assert.equal(type, "IHDR");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function parseJpegSize(buf: Buffer): { width: number; height: number } {
  assert.equal(buf[0], 0xff);
  assert.equal(buf[1], 0xd8);
  let offset = 2;
  while (offset + 4 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1]!;
    offset += 2;
    if (marker === 0xd9) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    const length = buf.readUInt16BE(offset);
    const segmentStart = offset + 2;
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buf.readUInt16BE(segmentStart + 1);
      const width = buf.readUInt16BE(segmentStart + 3);
      return { width, height };
    }
    offset = offset + length;
  }
  throw new Error("JPEG size not found");
}

async function expectedCanvasSize(options: {
  cols: number;
  rows: number;
  fontSize: number;
  lineHeight: number;
  margin: number;
}): Promise<{ width: number; height: number }> {
  const typography = await ensureFontReady();
  const metricsCanvas = createCanvas(1, 1);
  const metricsCtx = metricsCanvas.getContext("2d");
  metricsCtx.font = `${options.fontSize}px ${typography.fontFamilyCss}`;
  const charWidth = metricsCtx.measureText("M").width;
  const lineHeightPx = Math.round(options.fontSize * options.lineHeight);
  const width = Math.ceil(options.margin * 2 + charWidth * options.cols);
  const height = Math.ceil(options.margin * 2 + lineHeightPx * options.rows);
  return { width, height };
}

async function runCli(args: string[], stdinText?: string): Promise<CliRunResult> {
  const cliPath = path.resolve(__dirname, "..", "cli.js");
  const child = spawn(process.execPath, [cliPath, ...args], { stdio: "pipe" });

  let stdout = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  if (stdinText !== undefined) {
    child.stdin.end(stdinText, "utf8");
  } else {
    child.stdin.end();
  }

  const code = await new Promise<number | null>((resolve) => {
    child.on("close", (c) => resolve(c));
  });

  return { code, stdout, stderr };
}

test("CLI E2E: stdin -> 输出 PNG 文件存在且尺寸正确", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "clishot-"));
  const outFile = path.join(dir, "stdin.png");

  const cols = 20;
  const rows = 10;
  const fontSize = 16;
  const lineHeight = 1.35;
  const margin = 24;

  const result = await runCli(
    [
      "render",
      "--out",
      outFile,
      "--format",
      "png",
      "--theme",
      "terminal",
      "--cols",
      String(cols),
      "--rows",
      String(rows),
      "--font-size",
      String(fontSize),
      "--line-height",
      String(lineHeight),
      "--margin",
      String(margin)
    ],
    "Hello\nWorld\n"
  );

  assert.equal(result.code, 0, result.stderr);

  const outputs = result.stdout
    .trim()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  assert.equal(outputs.length, 1);
  assert.equal(path.normalize(outputs[0]!), path.normalize(outFile));

  const buf = await readFile(outFile);
  const size = parsePngSize(buf);
  const expected = await expectedCanvasSize({ cols, rows, fontSize, lineHeight, margin });
  assert.deepEqual(size, expected);
});

test("CLI E2E: stdin -> 输出 JPG 文件存在且尺寸正确", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "clishot-"));
  const outFile = path.join(dir, "stdin.jpg");

  const cols = 18;
  const rows = 8;
  const fontSize = 16;
  const lineHeight = 1.35;
  const margin = 24;

  const result = await runCli(
    [
      "render",
      "--out",
      outFile,
      "--format",
      "jpg",
      "--theme",
      "paper",
      "--cols",
      String(cols),
      "--rows",
      String(rows),
      "--font-size",
      String(fontSize),
      "--line-height",
      String(lineHeight),
      "--margin",
      String(margin),
      "--jpg-quality",
      "85"
    ],
    "Hello\nWorld\n"
  );

  assert.equal(result.code, 0, result.stderr);

  const outputs = result.stdout
    .trim()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  assert.equal(outputs.length, 1);
  assert.equal(path.normalize(outputs[0]!), path.normalize(outFile));

  const buf = await readFile(outFile);
  const size = parseJpegSize(buf);
  const expected = await expectedCanvasSize({ cols, rows, fontSize, lineHeight, margin });
  assert.deepEqual(size, expected);
});

test("CLI E2E: --in 文件 -> 多页命名正确且页数符合预期", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "clishot-"));
  const inFile = path.join(dir, "input.txt");
  const outPrefix = path.join(dir, "pages");

  const rows = 20;
  const lineCount = 45;
  const lines = Array.from({ length: lineCount }, (_, i) => `L${String(i + 1).padStart(2, "0")}`);
  await writeFile(inFile, lines.join("\n") + "\n", "utf8");

  const result = await runCli([
    "render",
    "--in",
    inFile,
    "--out",
    outPrefix,
    "--format",
    "png",
    "--theme",
    "terminal",
    "--cols",
    "80",
    "--rows",
    String(rows)
  ]);

  assert.equal(result.code, 0, result.stderr);

  const outputs = result.stdout
    .trim()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  assert.equal(outputs.length, 3);

  const expectedFiles = ["pages-001.png", "pages-002.png", "pages-003.png"].map((name) =>
    path.join(dir, name)
  );
  assert.deepEqual(
    outputs.map((p) => path.normalize(p)),
    expectedFiles.map((p) => path.normalize(p))
  );

  for (const f of expectedFiles) {
    const buf = await readFile(f);
    const size = parsePngSize(buf);
    assert.equal(size.width > 0, true);
    assert.equal(size.height > 0, true);
  }
});
