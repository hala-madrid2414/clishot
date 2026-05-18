export type LayoutOptions = {
  cols: number;
  rows: number;
};

export function layoutTextToPages(text: string, options: LayoutOptions): string[][] {
  const wrappedLines = wrapTextByColumns(text, options.cols);
  return paginateLines(wrappedLines, options.rows);
}

export function wrapTextByColumns(text: string, cols: number): string[] {
  const rawLines = text.split("\n");
  const out: string[] = [];

  for (const raw of rawLines) {
    if (raw.length === 0) {
      out.push("");
      continue;
    }

    let current = "";
    let currentCols = 0;
    for (const ch of raw) {
      if (currentCols >= cols) {
        out.push(current);
        current = "";
        currentCols = 0;
      }
      current += ch;
      currentCols += 1;
    }

    out.push(current);
  }

  return out;
}

export function paginateLines(lines: string[], rows: number): string[][] {
  if (lines.length === 0) {
    return [[""]];
  }

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += rows) {
    pages.push(lines.slice(i, i + rows));
  }
  return pages;
}
