export type CleanTextOptions = {
  tabStop: number;
};

export function cleanTextForRender(input: string, options: CleanTextOptions): string {
  const normalized = normalizeNewlines(input);
  const crApplied = applyCarriageReturnOverwrites(normalized);
  const stripped = stripControlCharacters(crApplied);
  return expandTabs(stripped, options.tabStop);
}

export function normalizeNewlines(input: string): string {
  return input.replaceAll("\r\n", "\n");
}

export function applyCarriageReturnOverwrites(input: string): string {
  const lines: string[] = [];
  let current: string[] = [];
  let cursor = 0;

  const flushLine = () => {
    lines.push(current.join(""));
    current = [];
    cursor = 0;
  };

  for (const ch of input) {
    if (ch === "\n") {
      flushLine();
      continue;
    }

    if (ch === "\r") {
      cursor = 0;
      continue;
    }

    while (cursor > current.length) {
      current.push(" ");
    }

    if (cursor === current.length) {
      current.push(ch);
    } else {
      current[cursor] = ch;
    }
    cursor += 1;
  }

  lines.push(current.join(""));
  return lines.join("\n");
}

export function stripControlCharacters(input: string): string {
  let out = "";
  for (const ch of input) {
    if (ch === "\n" || ch === "\t") {
      out += ch;
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    const isC0 = code >= 0x00 && code <= 0x1f;
    const isDel = code === 0x7f;
    if (isC0 || isDel) {
      continue;
    }
    out += ch;
  }
  return out;
}

export function expandTabs(input: string, tabStop: number): string {
  const rawLines = input.split("\n");
  const expandedLines = rawLines.map((line) => {
    let out = "";
    let col = 0;

    for (const ch of line) {
      if (ch === "\t") {
        const spaces = tabStop - (col % tabStop);
        out += " ".repeat(spaces);
        col += spaces;
        continue;
      }

      out += ch;
      col += 1;
    }

    return out;
  });

  return expandedLines.join("\n");
}

