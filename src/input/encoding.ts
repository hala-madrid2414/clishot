const AUTO_ENCODING = "auto";
const ENCODING_EXAMPLES = "utf-8、utf-16le、gb18030";

export type DecodedInput = {
  text: string;
  encoding: string;
  mode: "auto" | "explicit";
};

export function decodeInputBuffer(
  buffer: Uint8Array,
  options: {
    encoding?: string;
    sourceLabel: string;
  }
): DecodedInput {
  const requestedEncoding = normalizeEncodingOption(options.encoding);
  const mode = requestedEncoding === AUTO_ENCODING ? "auto" : "explicit";
  const effectiveEncoding =
    requestedEncoding === AUTO_ENCODING ? detectEncoding(buffer) : requestedEncoding;

  try {
    const decoder = new TextDecoder(effectiveEncoding, { fatal: true });
    return {
      text: decoder.decode(buffer),
      encoding: decoder.encoding,
      mode
    };
  } catch {
    if (mode === "explicit") {
      throw new Error(
        `无法按 ${effectiveEncoding} 解码输入文件：${options.sourceLabel}。请确认 --encoding 是否正确；可用示例：${ENCODING_EXAMPLES}。`
      );
    }

    throw new Error(
      `无法自动解码输入文件：${options.sourceLabel}。请使用 --encoding 显式指定实际编码；可用示例：${ENCODING_EXAMPLES}。`
    );
  }
}

function normalizeEncodingOption(value?: string): string {
  const rawValue = value ?? AUTO_ENCODING;
  const trimmed = rawValue.trim();

  if (trimmed.length === 0) {
    throw new Error(`--encoding 不能为空；可用示例：${ENCODING_EXAMPLES}，或使用 auto 自动识别。`);
  }

  if (trimmed.toLowerCase() === AUTO_ENCODING) {
    return AUTO_ENCODING;
  }

  try {
    return new TextDecoder(trimmed).encoding;
  } catch {
    throw new Error(
      `--encoding "${rawValue}" 无效；可用示例：${ENCODING_EXAMPLES}，或使用 auto 自动识别。`
    );
  }
}

function detectEncoding(buffer: Uint8Array): string {
  if (hasUtf8Bom(buffer)) {
    return "utf-8";
  }

  if (hasUtf16LeBom(buffer)) {
    return "utf-16le";
  }

  if (hasUtf16BeBom(buffer)) {
    return "utf-16be";
  }

  if (looksLikeUtf16Le(buffer)) {
    return "utf-16le";
  }

  if (looksLikeUtf16Be(buffer)) {
    return "utf-16be";
  }

  return "utf-8";
}

function hasUtf8Bom(buffer: Uint8Array): boolean {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function hasUtf16LeBom(buffer: Uint8Array): boolean {
  return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe;
}

function hasUtf16BeBom(buffer: Uint8Array): boolean {
  return buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff;
}

function looksLikeUtf16Le(buffer: Uint8Array): boolean {
  return looksLikeUtf16WithAlternatingNulls(buffer, "le");
}

function looksLikeUtf16Be(buffer: Uint8Array): boolean {
  return looksLikeUtf16WithAlternatingNulls(buffer, "be");
}

function looksLikeUtf16WithAlternatingNulls(buffer: Uint8Array, endianness: "le" | "be"): boolean {
  const sampleLength = Math.min(buffer.length - (buffer.length % 2), 64);
  if (sampleLength < 4) {
    return false;
  }

  let pairs = 0;
  let zeroEven = 0;
  let zeroOdd = 0;

  for (let i = 0; i < sampleLength; i += 2) {
    pairs += 1;
    if (buffer[i] === 0x00) {
      zeroEven += 1;
    }
    if (buffer[i + 1] === 0x00) {
      zeroOdd += 1;
    }
  }

  const dominantZeroCount = endianness === "le" ? zeroOdd : zeroEven;
  const secondaryZeroCount = endianness === "le" ? zeroEven : zeroOdd;

  return dominantZeroCount >= Math.ceil(pairs * 0.6) && secondaryZeroCount <= Math.floor(pairs * 0.2);
}
