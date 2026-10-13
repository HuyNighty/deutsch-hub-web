import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const repo = path.resolve(root, "../..");
const artifact = (name) => path.join(root, ".artifacts", "p3b", name);

export default defineConfig({
  testDir: path.join(root, "browser"),
  testMatch: "**/*.e2e-check.js",
  forbidOnly: true,
  retries: 0,
  workers: 2,
  outputDir: artifact("test-results"),
  reporter: [["line"], ["json", { outputFile: artifact("playwright.json") }], ["html", { outputFolder: artifact("html-report"), open: "never" }]],
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:5180",
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [{
    command: `"${process.execPath}" "${path.join(repo, "node_modules/vite/bin/vite.js")}" preview --config "${path.join(root, "vite.config.mjs")}"`,
    cwd: repo,
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
  }, {
    // Immutable P3-A extraction built with the same installed toolchain.
    command: `"${process.execPath}" "${path.join(repo, "node_modules/vite/bin/vite.js")}" preview --config "${artifact("static-baseline/vite.config.mjs")}" --port 5181`,
    cwd: repo,
    url: "http://127.0.0.1:5181",
    reuseExistingServer: false,
  }],
});
