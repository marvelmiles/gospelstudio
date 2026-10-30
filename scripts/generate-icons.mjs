import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const BACKGROUND = "#101013";

const icon = readFileSync("public/icon.svg", "utf8");

function onBackground(artScale) {
  return icon.replace(
    '<g id="art"',
    `<rect width="512" height="512" fill="${BACKGROUND}"/><g id="art" transform="translate(256 256) scale(${artScale}) translate(-256 -256)"`,
  );
}

function render(svg, size, file) {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  }).render();
  writeFileSync(`public/${file}`, png.asPng());
  console.log(`public/${file} (${size}x${size})`);
}

render(icon, 192, "icon-192.png");
render(icon, 512, "icon-512.png");
render(onBackground(0.62), 512, "icon-maskable-512.png");
render(onBackground(0.74), 180, "apple-touch-icon.png");
