import { defineConfig } from "vite";

const sharedBuildOptions = {
  outDir: "dist",
  emptyOutDir: false,
};

export default defineConfig(({ mode }) => ({
  build: {
    ...sharedBuildOptions,
    lib: {
      entry: mode === "cdn" ? "src/browser.js" : "src/FlowFX.js",
      name: "FlowFX",
      fileName: () => mode === "cdn" ? "flowfx.min.js" : "flowfx.es.js",
      formats: [mode === "cdn" ? "iife" : "es"],
    },
  },
}));
