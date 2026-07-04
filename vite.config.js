import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/FlowFX.js",
      name: "FlowFX",
      fileName: () => "flowfx.min.js",
      formats: ["iife"]
    },
    outDir: "dist",
    emptyOutDir: true
  }
});
