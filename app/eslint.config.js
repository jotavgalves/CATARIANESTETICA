import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "supabase/functions/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        { "name": "fbq", "message": "Use src/public/analytics.ts." },
        { "name": "gtag", "message": "Use src/public/analytics.ts." },
        { "name": "dataLayer", "message": "Use src/public/analytics.ts." }
      ],
      "no-restricted-syntax": [
        "error",
        { "selector": "CallExpression[callee.object.name='console'][callee.property.name='log']", "message": "Remove debug logging." }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error"
    }
  }
);
