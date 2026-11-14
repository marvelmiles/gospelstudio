const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16_LITTLE_ENDIAN_BOM = [0xff, 0xfe] as const;
const UTF16_BIG_ENDIAN_BOM = [0xfe, 0xff] as const;

const SAMPLE_BYTES = 1024;
const UTF16_ZERO_SHARE = 0.3;
const DEFAULT_CODE_PAGE = 1252;

const CODE_PAGE_LABELS: Record<number, string> = {
  932: "shift_jis",
  936: "gbk",
  949: "euc-kr",
  950: "big5",
  65001: "utf-8",
};

const WINDOWS_1252_SPECIALS_START = 0x80;
const WINDOWS_1252_SPECIALS = [
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030,
  0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d,
  0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e,
  0x178,
] as const;

const startsWith = (bytes: Uint8Array, prefix: readonly number[]): boolean =>
  prefix.every((value, index) => bytes[index] === value);

const sampleOf = (bytes: Uint8Array): Uint8Array =>
  bytes.subarray(0, Math.min(bytes.length, SAMPLE_BYTES));

const looksLikeUtf16LittleEndian = (bytes: Uint8Array): boolean => {
  const sample = sampleOf(bytes);
  if (sample.length < 4) return false;
  let highZeros = 0;
  let lowZeros = 0;
  for (let index = 0; index + 1 < sample.length; index += 2) {
    if (sample[index] === 0) lowZeros += 1;
    if (sample[index + 1] === 0) highZeros += 1;
  }
  const pairs = Math.floor(sample.length / 2);
  return highZeros / pairs >= UTF16_ZERO_SHARE && lowZeros / pairs < 0.05;
};

const decodeWindows1252 = (bytes: Uint8Array): string => {
  const codes = new Uint16Array(bytes.length);
  bytes.forEach((byte, index) => {
    const special = byte - WINDOWS_1252_SPECIALS_START;
    codes[index] =
      special >= 0 && special < WINDOWS_1252_SPECIALS.length
        ? WINDOWS_1252_SPECIALS[special]
        : byte;
  });
  return new TextDecoder("utf-16le").decode(codes);
};

const decoderFor = (label: string): TextDecoder | null => {
  try {
    return new TextDecoder(label);
  } catch {
    return null;
  }
};

export const decodeCodePage = (
  bytes: Uint8Array,
  codePage: number = DEFAULT_CODE_PAGE,
): string => {
  if (codePage === DEFAULT_CODE_PAGE) return decodeWindows1252(bytes);
  const decoder = decoderFor(
    CODE_PAGE_LABELS[codePage] ?? `windows-${codePage}`,
  );
  return decoder ? decoder.decode(bytes) : decodeWindows1252(bytes);
};

export const decodeTextBytes = (bytes: Uint8Array): string => {
  if (startsWith(bytes, UTF8_BOM))
    return new TextDecoder("utf-8").decode(bytes.subarray(UTF8_BOM.length));
  if (startsWith(bytes, UTF16_LITTLE_ENDIAN_BOM))
    return new TextDecoder("utf-16le").decode(
      bytes.subarray(UTF16_LITTLE_ENDIAN_BOM.length),
    );
  if (startsWith(bytes, UTF16_BIG_ENDIAN_BOM))
    return new TextDecoder("utf-16be").decode(
      bytes.subarray(UTF16_BIG_ENDIAN_BOM.length),
    );
  if (looksLikeUtf16LittleEndian(bytes))
    return new TextDecoder("utf-16le").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return decodeCodePage(bytes);
  }
};

export const looksLikeBinary = (bytes: Uint8Array): boolean => {
  if (
    startsWith(bytes, UTF16_LITTLE_ENDIAN_BOM) ||
    startsWith(bytes, UTF16_BIG_ENDIAN_BOM) ||
    looksLikeUtf16LittleEndian(bytes)
  )
    return false;
  return sampleOf(bytes).includes(0);
};
