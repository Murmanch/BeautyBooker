import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";


// Простой плагин копирования ассетов без внешних зависимостей
function copyAttachedAssetsPlugin() {
  return {
    name: "copy-attached-assets",
    apply: "build",
    async writeBundle() {
      const srcDir = path.resolve(import.meta.dirname, "attached_assets");
      const destDir = path.resolve(import.meta.dirname, "dist/public/assets");
      if (!fs.existsSync(srcDir)) return;

      fs.mkdirSync(destDir, { recursive: true });
      for (const entry of fs.readdirSync(srcDir)) {
        const src = path.join(srcDir, entry);
        const dest = path.join(destDir, entry);
        fs.copyFileSync(src, dest);
      }
    },
  } as const;
}

export default defineConfig({
  plugins: [
    react(),
    copyAttachedAssetsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
