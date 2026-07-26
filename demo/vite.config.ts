import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    rollupOptions: {
      input: "src/main.ts",
      output: {
        format: "esm",
        entryFileNames: "build.js",
      },
    },
  },
  resolve: {
    alias: {
      hp_prime: path.resolve(__dirname, "../compiler/types.d.ts"),
    },
  },
});
