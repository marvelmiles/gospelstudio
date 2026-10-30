import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "public/assets/images";
const THUMBS_DIR = join(SOURCE_DIR, "thumbs");
const THUMB_WIDTH = 960;
const THUMB_QUALITY = 78;

mkdirSync(THUMBS_DIR, { recursive: true });

const pictures = readdirSync(SOURCE_DIR).filter((file) =>
  file.toLowerCase().endsWith(".jpg"),
);

for (const file of pictures) {
  const output = join(THUMBS_DIR, file);
  const { width, height, size } = await sharp(join(SOURCE_DIR, file))
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
    .toFile(output);
  console.log(`${output} (${width}x${height}, ${Math.round(size / 1024)} KB)`);
}
