import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    minify: false,
    rollupOptions: {
      input: "src/main.ts",
      external: ["hp_prime"],
      treeshake: false,
      output: {
        format: "esm",
        minify: false,
        entryFileNames: "build.js",
        topLevelVar: false,
      },
    },
  },
  resolve: {
    alias: {
      hp_prime: path.resolve(__dirname, "../compiler/src/index.d.ts"),
    },
  },
});
