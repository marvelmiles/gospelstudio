import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetDir = join(projectRoot, "src", "contracts");
const isCheck = process.argv.includes("--check");

const SOURCES = [
  {
    name: "relay server",
    folder: "gospelstudio-relay-server",
    directoryVariable: "RELAY_SERVER_DIR",
  },
  {
    name: "API",
    folder: "gospelstudio-api",
    directoryVariable: "API_SERVER_DIR",
  },
].map((source) => ({
  ...source,
  contractsDir: join(
    resolve(
      projectRoot,
      process.env[source.directoryVariable] ?? `../${source.folder}`,
    ),
    "src",
    "contracts",
  ),
}));

const normalizeLineEndings = (text) => text.replace(/\r\n/g, "\n");

const listFiles = (directory) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort()
    : [];

const readText = (directory, name) =>
  normalizeLineEndings(readFileSync(join(directory, name), "utf8"));

const missing = SOURCES.filter((source) => !existsSync(source.contractsDir));
if (missing.length > 0) {
  for (const source of missing)
    console.error(
      `The ${source.name} contracts were not found at ${source.contractsDir}.\nClone ${source.folder} next to this project, or set ${source.directoryVariable} to its folder.`,
    );
  process.exit(1);
}

const owners = new Map();
for (const source of SOURCES) {
  for (const name of listFiles(source.contractsDir)) {
    const owner = owners.get(name);
    if (owner) {
      console.error(
        `${name} exists in both the ${owner.name} and the ${source.name}. Rename one of them.`,
      );
      process.exit(1);
    }
    owners.set(name, source);
  }
}

const targetFiles = new Set(listFiles(targetDir));
const outdated = [...owners].filter(
  ([name, source]) =>
    !targetFiles.has(name) ||
    readText(source.contractsDir, name) !== readText(targetDir, name),
);
const extra = [...targetFiles].filter((name) => !owners.has(name));
const shownTarget = relative(projectRoot, targetDir).replaceAll("\\", "/");

if (isCheck) {
  if (outdated.length === 0 && extra.length === 0) {
    console.log(
      `${shownTarget} matches the ${SOURCES.map((source) => source.name).join(" and ")} contracts.`,
    );
    process.exit(0);
  }
  for (const [name, source] of outdated)
    console.error(
      `Out of date with the ${source.name}: ${shownTarget}/${name}`,
    );
  for (const name of extra)
    console.error(`Not in any server: ${shownTarget}/${name}`);
  console.error("Run pnpm contracts:sync to update them.");
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
for (const [name, source] of outdated)
  writeFileSync(join(targetDir, name), readText(source.contractsDir, name));
for (const name of extra) rmSync(join(targetDir, name));

console.log(
  outdated.length + extra.length === 0
    ? `${shownTarget} is already up to date.`
    : `Updated ${outdated.length} and removed ${extra.length} file(s) in ${shownTarget}.`,
);
