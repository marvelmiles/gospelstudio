import qrcode from "qrcode-generator";

export interface QrPath {
  modules: number;
  path: string;
}

const QUIET_ZONE = 2;

const utf8Bytes = (value: string): number[] => [
  ...new TextEncoder().encode(value),
];

export const buildQrPath = (value: string): QrPath | null => {
  const text = value.trim();
  if (!text) return null;
  const previousEncoder = qrcode.stringToBytes;
  qrcode.stringToBytes = utf8Bytes;
  try {
    const qr = qrcode(0, "M");
    qr.addData(text, "Byte");
    qr.make();
    const count = qr.getModuleCount();
    let path = "";
    for (let row = 0; row < count; row += 1)
      for (let col = 0; col < count; col += 1)
        if (qr.isDark(row, col))
          path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    return { modules: count + QUIET_ZONE * 2, path };
  } catch {
    return null;
  } finally {
    qrcode.stringToBytes = previousEncoder;
  }
};
