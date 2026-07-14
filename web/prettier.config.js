/** @type {import("prettier").Config} */
const config = {
  trailingComma: "es5",
  printWidth: 80,
  plugins: ["prettier-plugin-svelte"],
  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
};

export default config;
