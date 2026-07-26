import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    rollupOptions: {
      input: "src/main.ts",
      external: ["hp_prime"],
      output: {
        format: "esm",
        entryFileNames: "build.js",
      },
    },
  },
  resolve: {
    alias: {
      hp_prime: path.resolve(__dirname, "../compiler/src/index.d.ts"),
    },
  },
});
