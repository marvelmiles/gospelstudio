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
const serverDir = resolve(
  projectRoot,
  process.env.RELAY_SERVER_DIR ?? "../gospelstudio-relay-server",
);
const sourceDir = join(serverDir, "src", "contracts");
const isCheck = process.argv.includes("--check");

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

if (!existsSync(sourceDir)) {
  console.error(
    `The relay server contracts were not found at ${sourceDir}.\nClone gospelstudio-relay-server next to this project, or set RELAY_SERVER_DIR to its folder.`,
  );
  process.exit(1);
}

const sourceFiles = listFiles(sourceDir);
const targetFiles = new Set(listFiles(targetDir));
const outdated = sourceFiles.filter(
  (name) =>
    !targetFiles.has(name) ||
    readText(sourceDir, name) !== readText(targetDir, name),
);
const extra = [...targetFiles].filter((name) => !sourceFiles.includes(name));
const shownTarget = relative(projectRoot, targetDir).replaceAll("\\", "/");

if (isCheck) {
  if (outdated.length === 0 && extra.length === 0) {
    console.log(`${shownTarget} matches ${sourceDir}`);
    process.exit(0);
  }
  for (const name of outdated) console.error(`Out of date: ${shownTarget}/${name}`);
  for (const name of extra)
    console.error(`Not in the relay server: ${shownTarget}/${name}`);
  console.error("Run pnpm contracts:sync to update them.");
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
for (const name of outdated)
  writeFileSync(join(targetDir, name), readText(sourceDir, name));
for (const name of extra) rmSync(join(targetDir, name));

console.log(
  outdated.length + extra.length === 0
    ? `${shownTarget} is already up to date.`
    : `Updated ${outdated.length} and removed ${extra.length} file(s) in ${shownTarget}.`,
);
