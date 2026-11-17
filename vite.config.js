import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { resolveApiBaseUrl } from "./src/shared/api/api-base-url.js";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    // Vite reads .env files after resolving config. Validate explicitly now
    // so an invalid public API endpoint cannot produce a deployable bundle.
    const env = loadEnv(mode, process.cwd(), "VITE_");
    resolveApiBaseUrl(env.VITE_API_BASE_URL, { development: false });
  }

  return {
  plugins: [react()],

  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    restoreMocks: true,
  },

  server: {
    watch: {
      usePolling: true,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    modules: {
      generateScopedName: "[name]_[local]_[hash:base64:5]",
    },
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use "@/shared/styles/_globals.scss" as *;
      `,
      },
    },
  },
  };
});
