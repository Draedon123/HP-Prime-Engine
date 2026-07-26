import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node16",
    outDir: "build",
    rollupOptions: {
      input: "src/main.ts",
      external: [/^node:/, "acorn"],
      output: {
        format: "cjs",
        entryFileNames: "compiler.cjs",
      },
    },
  },
});
