export interface ImportFile {
  file: File;
  path: string;
}

export interface DroppedFiles {
  files: ImportFile[];
  includesFolder: boolean;
}

const SYSTEM_FILE_NAMES = new Set(["thumbs.db", "desktop.ini", ".ds_store"]);

const leafName = (path: string): string =>
  (path.split(/[\\/]/).pop() ?? path).toLowerCase();

export const isSystemFile = (path: string): boolean => {
  const name = leafName(path);
  return (
    name.startsWith(".") || name.startsWith("~$") || SYSTEM_FILE_NAMES.has(name)
  );
};

export const sortImportFiles = (files: ImportFile[]): ImportFile[] =>
  [...files].sort((first, second) =>
    first.path.localeCompare(second.path, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

export const importFilesFromList = (list: FileList | File[]): ImportFile[] =>
  Array.from(list, (file) => ({
    file,
    path: file.webkitRelativePath || file.name,
  }));

export const importFileFromText = (text: string, name: string): ImportFile => {
  const fileName = `${name}.txt`;
  return {
    file: new File([text], fileName, { type: "text/plain" }),
    path: fileName,
  };
};

const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry =>
  entry.isFile;

const isDirectoryEntry = (
  entry: FileSystemEntry,
): entry is FileSystemDirectoryEntry => entry.isDirectory;

const readEntryFile = (entry: FileSystemFileEntry): Promise<File> =>
  new Promise((resolve, reject) => entry.file(resolve, reject));

const readDirectoryBatch = (
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const collectEntry = async (
  entry: FileSystemEntry,
  found: ImportFile[],
): Promise<void> => {
  if (isFileEntry(entry)) {
    found.push({
      file: await readEntryFile(entry),
      path: entry.fullPath.replace(/^\/+/, ""),
    });
    return;
  }
  if (!isDirectoryEntry(entry)) return;
  const reader = entry.createReader();
  for (
    let batch = await readDirectoryBatch(reader);
    batch.length;
    batch = await readDirectoryBatch(reader)
  )
    for (const child of batch) await collectEntry(child, found);
};

export const importFilesFromDrop = async (
  data: DataTransfer,
): Promise<DroppedFiles> => {
  const entries = Array.from(data.items).flatMap((item) => {
    const entry = item.kind === "file" ? item.webkitGetAsEntry() : null;
    return entry ? [entry] : [];
  });
  if (!entries.length)
    return { files: importFilesFromList(data.files), includesFolder: false };

  const found: ImportFile[] = [];
  for (const entry of entries) await collectEntry(entry, found);
  return { files: found, includesFolder: entries.some(isDirectoryEntry) };
};
