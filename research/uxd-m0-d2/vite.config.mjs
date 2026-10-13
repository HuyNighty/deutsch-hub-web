import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const artifact = (name) => path.join(root, ".artifacts", name);

export default defineConfig({
  root,
  envDir: false,
  publicDir: false,
  cacheDir: artifact("vite"),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5179,
    strictPort: true,
    fs: { strict: true, allow: [root, path.resolve(root, "../../node_modules")] },
  },
  preview: { host: "127.0.0.1", port: 5180, strictPort: true },
  build: {
    outDir: artifact("site"),
    emptyOutDir: true,
    rolldownOptions: { input: {
      static: path.join(root, "index.html"),
      interaction: path.join(root, "interaction.html"),
      participant: path.join(root, "participant.html"),
    } },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.research-check.{js,jsx}"],
    setupFiles: [path.join(root, "src/test-setup.js")],
    restoreMocks: true,
    pool: "forks",
    maxWorkers: 1,
    coverage: { reportsDirectory: artifact("coverage") },
  },
});
