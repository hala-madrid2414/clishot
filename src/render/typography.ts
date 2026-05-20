import { GlobalFonts } from "@napi-rs/canvas";
import { readdir } from "node:fs/promises";
import path from "node:path";

export type Typography = {
  fontFamilyCss: string;
};

let cached: Typography | null = null;

const PRIMARY_MONO_FAMILY = "JetBrains Mono";

const MONO_FALLBACK_FAMILIES = [
  PRIMARY_MONO_FAMILY,
  "Cascadia Mono",
  "Cascadia Code",
  "Consolas",
  "Menlo",
  "Monaco",
  "DejaVu Sans Mono",
  "Liberation Mono",
  "Courier New"
] as const;

const WINDOWS_CJK_FALLBACK_FAMILIES = [
  "Microsoft YaHei UI",
  "Microsoft YaHei",
  "DengXian",
  "SimHei",
  "SimSun",
  "KaiTi"
] as const;

const MACOS_CJK_FALLBACK_FAMILIES = [
  "PingFang SC",
  "Hiragino Sans GB",
  "Songti SC",
  "Heiti SC",
  "STHeiti"
] as const;

const LINUX_CJK_FALLBACK_FAMILIES = [
  "Noto Sans Mono CJK SC",
  "Noto Sans CJK SC",
  "Source Han Mono SC",
  "Source Han Sans SC",
  "WenQuanYi Micro Hei",
  "Sarasa Mono SC",
  "AR PL UMing CN"
] as const;

const BUNDLED_JETBRAINS_EXTENSIONS = [".ttf", ".otf", ".woff2", ".woff"] as const;

export async function ensureFontReady(): Promise<Typography> {
  if (cached) {
    return cached;
  }

  const fontPath = await findBundledJetBrainsMonoFont();
  if (fontPath) {
    try {
      GlobalFonts.registerFromPath(fontPath, PRIMARY_MONO_FAMILY);
    } catch {
      // ignore and fall back to system fonts
    }
  }

  cached = {
    fontFamilyCss: toFontFamilyCss([
      ...MONO_FALLBACK_FAMILIES,
      ...getCjkFallbackFamilies(),
      "monospace"
    ])
  };

  return cached;
}

async function findBundledJetBrainsMonoFont(): Promise<string | null> {
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

  const fontFiles = entries.filter((entry) =>
    BUNDLED_JETBRAINS_EXTENSIONS.some((ext) => entry.toLowerCase().endsWith(ext))
  );
  if (fontFiles.length === 0) {
    return null;
  }

  const preferred =
    pickPreferredBundledFont(fontFiles, "jetbrains-mono-latin-400-normal") ??
    pickPreferredBundledFont(fontFiles, "jetbrains-mono-latin-ext-400-normal") ??
    pickPreferredBundledFont(fontFiles, "jetbrains-mono-400-normal") ??
    fontFiles[0]!;

  return path.join(filesDir, preferred);
}

function getCjkFallbackFamilies(): string[] {
  const platformPreferred =
    process.platform === "win32"
      ? WINDOWS_CJK_FALLBACK_FAMILIES
      : process.platform === "darwin"
        ? MACOS_CJK_FALLBACK_FAMILIES
        : LINUX_CJK_FALLBACK_FAMILIES;

  const combined = dedupeFamilies([
    ...platformPreferred,
    ...WINDOWS_CJK_FALLBACK_FAMILIES,
    ...MACOS_CJK_FALLBACK_FAMILIES,
    ...LINUX_CJK_FALLBACK_FAMILIES
  ]);

  const installed = combined.filter((family) => GlobalFonts.has(family));
  const notInstalled = combined.filter((family) => !GlobalFonts.has(family));

  return [...installed, ...notInstalled];
}

function pickPreferredBundledFont(files: string[], basename: string): string | null {
  for (const ext of BUNDLED_JETBRAINS_EXTENSIONS) {
    const matched = files.find((file) => file.toLowerCase() === `${basename}${ext}`);
    if (matched) {
      return matched;
    }
  }

  return null;
}

function dedupeFamilies(families: readonly string[]): string[] {
  return [...new Set(families)];
}

function toFontFamilyCss(families: readonly string[]): string {
  return families
    .map((family) => (needsQuotes(family) ? `"${family}"` : family))
    .join(",");
}

function needsQuotes(family: string): boolean {
  return family !== "monospace" && /\s/.test(family);
}
