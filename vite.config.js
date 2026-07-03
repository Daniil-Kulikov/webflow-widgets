import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.js",
      name: "WWWLogo",
      fileName: () => "www-logo.min.js",
      formats: ["iife"]
    },
    outDir: "dist",
    emptyOutDir: true
  }
});