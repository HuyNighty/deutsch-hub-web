import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

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
});
