const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  { ignores: ["build/**", "node_modules/**", "public/**", "craco.config.js"] },
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, process: "readonly" },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...js.configs.recommended.rules,
      // Codebase-wide softening: surface issues as warnings, never block builds.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^[A-Z_]" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-console": "off",
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
