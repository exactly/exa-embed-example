import react from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{ts,tsx,js}"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: { allowDefaultProject: ["mock/*", "*.config.*"] },
      tsconfigRootDir: import.meta.dirname,
    },
  },
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    reactHooks.configs.flat.recommended,
    react.configs["recommended-type-checked"],
    unicorn.configs.recommended,
  ],
  rules: {
    "@eslint-react/dom/no-missing-iframe-sandbox": "off",
    "@typescript-eslint/no-deprecated": "warn",
    "unicorn/filename-case": "off",
    "unicorn/no-await-expression-member": "off",
    "unicorn/no-null": "off",
    "unicorn/prefer-global-this": "off",
    "unicorn/prevent-abbreviations": ["error", { allowList: { params: true } }],
    "unicorn/switch-case-braces": ["error", "avoid"],
  },
  ignores: ["dist/**"],
});
