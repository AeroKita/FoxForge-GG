/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// base: relative "./" by default (works in Tauri + any sub-path); the Pages
// build overrides with VITE_BASE=/Pokemon-UNITE-Build-Tool/.
export default defineConfig({
  base: process.env.VITE_BASE ?? "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Pokémon UNITE Build Optimizer",
        short_name: "UNITE Builds",
        description: "Design optimized Pokémon UNITE loadouts — emblems, held & trainer items, attack speed, and live stats.",
        theme_color: "#4f46e5",
        background_color: "#eef1f5",
        display: "standalone",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache only the app shell; the ~22 MB of art is runtime-cached on use.
        globPatterns: ["**/*.{js,css,html}"],
        maximumFileSizeToCacheInBytes: 4_000_000,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/assets/") && url.pathname.endsWith(".png"),
            handler: "CacheFirst",
            options: { cacheName: "unite-art", expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
    }),
  ],
  // Tauri-friendly dev server.
  clearScreen: false,
  server: { strictPort: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
