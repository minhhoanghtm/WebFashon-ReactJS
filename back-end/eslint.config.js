export default [
  {
    ignores: ["node_modules/**", "uploads/**", "scripts/**", "scratch/**", "migrations/**"],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {},
  },
];
