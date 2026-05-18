import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type OutputFormat = "png" | "jpg";

export async function validateOutputDirectory(outPath: string): Promise<void> {
  const parsed = path.parse(outPath);
  if (!parsed.base) {
    throw new Error(`--out 不能是目录路径：${outPath}`);
  }

  const dir = parsed.dir.length > 0 ? parsed.dir : ".";
  const absoluteDir = path.resolve(process.cwd(), dir);

  let s;
  try {
    s = await stat(absoluteDir);
  } catch {
    throw new Error(`输出目录不存在：${absoluteDir}`);
  }

  if (!s.isDirectory()) {
    throw new Error(`输出目录不是文件夹：${absoluteDir}`);
  }

  try {
    await access(absoluteDir, constants.W_OK);
  } catch {
    throw new Error(`输出目录不可写：${absoluteDir}`);
  }
}

export function resolveOutputPaths(
  outPath: string,
  options: { format: OutputFormat; pageCount: number }
): string[] {
  const parsed = path.parse(outPath);
  const desiredExt = options.format === "png" ? ".png" : ".jpg";

  const hasExt = parsed.ext.length > 0;
  const baseWithoutExt = path.join(parsed.dir, hasExt ? parsed.name : parsed.base);

  if (options.pageCount <= 1) {
    return [`${baseWithoutExt}${desiredExt}`];
  }

  const outputs: string[] = [];
  for (let i = 1; i <= options.pageCount; i++) {
    outputs.push(`${baseWithoutExt}-${pad3(i)}${desiredExt}`);
  }
  return outputs;
}

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}
