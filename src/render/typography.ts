import { GlobalFonts } from "@napi-rs/canvas";
import { readdir } from "node:fs/promises";
import path from "node:path";

export type Typography = {
  fontFamilyCss: string;
};

let cached: Typography | null = null;

export async function ensureFontReady(): Promise<Typography> {
  if (cached) {
    return cached;
  }

  const primaryFamily = "JetBrains Mono";
  const fontPath = await findBundledJetBrainsMonoTtf();
  if (fontPath) {
    try {
      GlobalFonts.registerFromPath(fontPath, primaryFamily);
    } catch {
      // ignore and fall back to system fonts
    }
  }

  cached = {
    fontFamilyCss:
      `"${primaryFamily}","Cascadia Mono",Consolas,Menlo,Monaco,"DejaVu Sans Mono","Courier New",monospace`
  };

  return cached;
}

async function findBundledJetBrainsMonoTtf(): Promise<string | null> {
  let pkgJsonPath: string;
  try {
    pkgJsonPath = require.resolve("@fontsource/jetbrains-mono/package.json");
  } catch {
    return null;
  }

  const pkgDir = path.dirname(pkgJsonPath);
  const filesDir = path.join(pkgDir, "files");

  let entries: string[];
  try {
    entries = await readdir(filesDir);
  } catch {
    return null;
  }

  const ttfFiles = entries.filter((e) => e.toLowerCase().endsWith(".ttf"));
  if (ttfFiles.length === 0) {
    return null;
  }

  const preferred =
    ttfFiles.find((f) => f.includes("latin-400-normal")) ??
    ttfFiles.find((f) => f.includes("400-normal")) ??
    ttfFiles[0]!;

  return path.join(filesDir, preferred);
}

