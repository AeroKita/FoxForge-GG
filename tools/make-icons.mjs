// Generate app/PWA icons from tools/app-icon.svg (run: node tools/make-icons.mjs).
// Tauri's own icon set is produced separately via `npx tauri icon icon-source.png`.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "tools/app-icon.svg";
mkdirSync("public", { recursive: true });

const outputs = [
  ["icon-source.png", 1024], // source for `tauri icon`
  ["public/pwa-192.png", 192],
  ["public/pwa-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["public/favicon-32.png", 32],
];
for (const [file, size] of outputs) {
  await sharp(SRC).resize(size, size).png().toFile(file);
  console.log("wrote", file, `${size}x${size}`);
}
