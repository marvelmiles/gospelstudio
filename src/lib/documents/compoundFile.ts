import { DocumentReadError } from "./documentReadError";

const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const;
const MAX_REGULAR_SECTOR = 0xfffffffa;
const NO_STREAM = 0xffffffff;

const SECTOR_SHIFT_OFFSET = 0x1e;
const MINI_SECTOR_SHIFT_OFFSET = 0x20;
const FIRST_DIRECTORY_SECTOR_OFFSET = 0x30;
const MINI_STREAM_CUTOFF_OFFSET = 0x38;
const FIRST_MINI_FAT_SECTOR_OFFSET = 0x3c;
const FIRST_DIFAT_SECTOR_OFFSET = 0x44;
const HEADER_DIFAT_OFFSET = 0x4c;
const HEADER_DIFAT_ENTRIES = 109;
const SUPPORTED_SECTOR_SHIFTS = [9, 12];

const DIRECTORY_ENTRY_SIZE = 128;
const DIRECTORY_NAME_BYTES = 64;
const STREAM_ENTRY = 2;
const ROOT_ENTRY = 5;

interface DirectoryEntry {
  name: string;
  type: number;
  left: number;
  right: number;
  child: number;
  start: number;
  size: number;
}

interface SectorSource {
  bytes: Uint8Array;
  view: DataView;
  sectorSize: number;
  sectorCount: number;
}

export interface CompoundFile {
  readStream: (name: string) => Uint8Array | null;
}

const corrupt = (): DocumentReadError => new DocumentReadError("unreadable");

const viewOf = (bytes: Uint8Array): DataView =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

export const isCompoundFile = (bytes: Uint8Array): boolean =>
  bytes.length >= 512 &&
  SIGNATURE.every((value, index) => bytes[index] === value);

const readHeaderValue = (source: SectorSource, offset: number): number =>
  source.view.getUint32(offset, true);

const sectorEntries = (source: SectorSource, sector: number): number[] => {
  const start = (sector + 1) * source.sectorSize;
  if (start + source.sectorSize > source.bytes.length) throw corrupt();
  const entries: number[] = [];
  for (let offset = 0; offset < source.sectorSize; offset += 4)
    entries.push(source.view.getUint32(start + offset, true));
  return entries;
};

const readFatSectorIds = (source: SectorSource): number[] => {
  const ids: number[] = [];
  for (let index = 0; index < HEADER_DIFAT_ENTRIES; index += 1) {
    const id = readHeaderValue(source, HEADER_DIFAT_OFFSET + index * 4);
    if (id <= MAX_REGULAR_SECTOR) ids.push(id);
  }

  let difatSector = readHeaderValue(source, FIRST_DIFAT_SECTOR_OFFSET);
  let visited = 0;
  while (difatSector <= MAX_REGULAR_SECTOR) {
    visited += 1;
    if (visited > source.sectorCount) throw corrupt();
    const entries = sectorEntries(source, difatSector);
    const next = entries.pop() ?? NO_STREAM;
    for (const id of entries) if (id <= MAX_REGULAR_SECTOR) ids.push(id);
    difatSector = next;
  }
  return ids;
};

const followChain = (table: number[], start: number): number[] => {
  const chain: number[] = [];
  let sector = start;
  while (sector <= MAX_REGULAR_SECTOR) {
    if (sector >= table.length || chain.length >= table.length) throw corrupt();
    chain.push(sector);
    sector = table[sector];
  }
  return chain;
};

const readSectors = (
  source: SectorSource,
  chain: number[],
  size: number,
): Uint8Array => {
  const output = new Uint8Array(chain.length * source.sectorSize);
  chain.forEach((sector, index) => {
    const start = (sector + 1) * source.sectorSize;
    output.set(
      source.bytes.subarray(start, start + source.sectorSize),
      index * source.sectorSize,
    );
  });
  return output.subarray(0, Math.min(size, output.length));
};

const readDirectory = (data: Uint8Array): DirectoryEntry[] => {
  const view = viewOf(data);
  const nameDecoder = new TextDecoder("utf-16le");
  const entries: DirectoryEntry[] = [];
  for (
    let offset = 0;
    offset + DIRECTORY_ENTRY_SIZE <= data.length;
    offset += DIRECTORY_ENTRY_SIZE
  ) {
    const nameLength = Math.min(
      DIRECTORY_NAME_BYTES,
      view.getUint16(offset + 0x40, true),
    );
    entries.push({
      name: nameDecoder.decode(
        data.subarray(offset, offset + Math.max(0, nameLength - 2)),
      ),
      type: data[offset + 0x42],
      left: view.getUint32(offset + 0x44, true),
      right: view.getUint32(offset + 0x48, true),
      child: view.getUint32(offset + 0x4c, true),
      start: view.getUint32(offset + 0x74, true),
      size: view.getUint32(offset + 0x78, true),
    });
  }
  return entries;
};

const childrenOf = (
  entries: DirectoryEntry[],
  parent: DirectoryEntry,
): DirectoryEntry[] => {
  const children: DirectoryEntry[] = [];
  const visited = new Set<number>();
  const pending = [parent.child];
  while (pending.length) {
    const id = pending.pop() ?? NO_STREAM;
    if (id >= entries.length || visited.has(id)) continue;
    visited.add(id);
    const entry = entries[id];
    children.push(entry);
    pending.push(entry.left, entry.right);
  }
  return children;
};

export const openCompoundFile = (bytes: Uint8Array): CompoundFile => {
  if (!isCompoundFile(bytes)) throw corrupt();
  const view = viewOf(bytes);
  const sectorShift = view.getUint16(SECTOR_SHIFT_OFFSET, true);
  if (!SUPPORTED_SECTOR_SHIFTS.includes(sectorShift)) throw corrupt();

  const sectorSize = 1 << sectorShift;
  const source: SectorSource = {
    bytes,
    view,
    sectorSize,
    sectorCount: Math.ceil(bytes.length / sectorSize) - 1,
  };
  const miniSectorSize = 1 << view.getUint16(MINI_SECTOR_SHIFT_OFFSET, true);
  const miniStreamCutoff = readHeaderValue(source, MINI_STREAM_CUTOFF_OFFSET);

  const fat = readFatSectorIds(source).flatMap((sector) =>
    sectorEntries(source, sector),
  );
  const readRegular = (start: number, size: number): Uint8Array =>
    readSectors(source, followChain(fat, start), size);

  const directoryChain = followChain(
    fat,
    readHeaderValue(source, FIRST_DIRECTORY_SECTOR_OFFSET),
  );
  const directory = readDirectory(
    readSectors(source, directoryChain, directoryChain.length * sectorSize),
  );
  const root = directory[0];
  if (!root || root.type !== ROOT_ENTRY) throw corrupt();
  const streams = childrenOf(directory, root).filter(
    (entry) => entry.type === STREAM_ENTRY,
  );

  let miniFat: number[] | null = null;
  let miniStream: Uint8Array | null = null;

  const readMini = (start: number, size: number): Uint8Array => {
    miniFat ??= followChain(
      fat,
      readHeaderValue(source, FIRST_MINI_FAT_SECTOR_OFFSET),
    ).flatMap((sector) => sectorEntries(source, sector));
    miniStream ??= readRegular(root.start, root.size);
    const chain = followChain(miniFat, start);
    const output = new Uint8Array(chain.length * miniSectorSize);
    chain.forEach((sector, index) => {
      const offset = sector * miniSectorSize;
      output.set(
        (miniStream ?? new Uint8Array()).subarray(
          offset,
          offset + miniSectorSize,
        ),
        index * miniSectorSize,
      );
    });
    return output.subarray(0, Math.min(size, output.length));
  };

  return {
    readStream: (name) => {
      const wanted = name.toLowerCase();
      const entry = streams.find(
        (candidate) => candidate.name.toLowerCase() === wanted,
      );
      if (!entry) return null;
      if (entry.size === 0) return new Uint8Array();
      return entry.size < miniStreamCutoff
        ? readMini(entry.start, entry.size)
        : readRegular(entry.start, entry.size);
    },
  };
};
