// Generate the committed icon source + all web/PWA icons from a master image.
//
//   node tools/make-icons.mjs [path/to/master.png]
//
// With no argument it reads the committed source (tools/app-icon.png). Pass a
// path to adopt a new master — it's normalized to a 1024×1024 RGBA PNG and
// written to tools/app-icon.png. Afterwards, regenerate the desktop (Tauri)
// icon set with:  npx tauri icon tools/app-icon.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "tools/app-icon.png";
const master = process.argv[2] ?? SRC;
mkdirSync("public", { recursive: true });

// Adopt a new master → normalized, committed source (idempotent for the default).
if (master !== SRC) {
  await sharp(master).resize(1024, 1024, { fit: "cover" }).ensureAlpha().png().toFile(SRC);
  console.log("wrote", SRC, "1024x1024 (source)");
}

const outputs = [
  ["public/pwa-192.png", 192],
  ["public/pwa-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["public/favicon-32.png", 32],
];
for (const [file, size] of outputs) {
  await sharp(SRC).resize(size, size).png().toFile(file);
  console.log("wrote", file, `${size}x${size}`);
}
