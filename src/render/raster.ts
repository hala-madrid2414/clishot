import { createCanvas } from "@napi-rs/canvas";
import type { Canvas } from "@napi-rs/canvas";
import type { Theme } from "./theme";
import type { Typography } from "./typography";

export function renderPageToCanvas(options: {
  lines: string[];
  cols: number;
  rows: number;
  theme: Theme;
  typography: Typography;
  fontSize: number;
  lineHeight: number;
  margin: number;
}): Canvas {
  const metricsCanvas = createCanvas(1, 1);
  const metricsCtx = metricsCanvas.getContext("2d");
  metricsCtx.font = `${options.fontSize}px ${options.typography.fontFamilyCss}`;
  metricsCtx.textBaseline = "top";

  const charWidth = metricsCtx.measureText("M").width;
  const lineHeightPx = Math.round(options.fontSize * options.lineHeight);

  const width = Math.ceil(options.margin * 2 + charWidth * options.cols);
  const height = Math.ceil(options.margin * 2 + lineHeightPx * options.rows);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = options.theme.background;
  ctx.fillRect(0, 0, width, height);

  ctx.font = metricsCtx.font;
  ctx.textBaseline = "top";
  ctx.fillStyle = options.theme.foreground;

  for (let i = 0; i < options.lines.length; i++) {
    const line = options.lines[i] ?? "";
    ctx.fillText(line, options.margin, options.margin + i * lineHeightPx);
  }

  return canvas;
}

export async function encodeCanvasToBuffer(
  canvas: Canvas,
  options: { format: "png" | "jpg"; jpgQuality: number }
): Promise<Buffer> {
  const anyCanvas = canvas as unknown as {
    encode?: (format: string, options?: unknown) => Promise<Buffer> | Buffer;
    toBuffer?: (mime?: string, options?: unknown) => Buffer;
  };

  if (typeof anyCanvas.encode === "function") {
    if (options.format === "png") {
      const out = anyCanvas.encode("png");
      return out instanceof Promise ? await out : out;
    }

    const out = anyCanvas.encode("jpeg", { quality: options.jpgQuality / 100 });
    return out instanceof Promise ? await out : out;
  }

  if (typeof anyCanvas.toBuffer === "function") {
    if (options.format === "png") {
      return anyCanvas.toBuffer("image/png");
    }
    return anyCanvas.toBuffer("image/jpeg", { quality: options.jpgQuality / 100 });
  }

  throw new Error(`当前渲染引擎不支持导出图片缓冲区`);
}
