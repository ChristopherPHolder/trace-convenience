import { defineConfig } from "vite-plus";

export default defineConfig({
  // `vp test` from the root runs every workspace package's tests.
  test: {
    projects: ["apps/*"],
  },
  run: {
    cache: true,
  },
  // Pre-commit hook (.vite-hooks/pre-commit) runs `vp staged`.
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "@angular-eslint", specifier: "@angular-eslint/eslint-plugin" },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        files: ["apps/web/src/**/*.ts"],
        rules: {
          "@angular-eslint/contextual-lifecycle": "error",
          "@angular-eslint/no-empty-lifecycle-method": "error",
          "@angular-eslint/no-input-rename": "error",
          "@angular-eslint/no-inputs-metadata-property": "error",
          "@angular-eslint/no-output-native": "error",
          "@angular-eslint/no-output-on-prefix": "error",
          "@angular-eslint/no-output-rename": "error",
          "@angular-eslint/no-outputs-metadata-property": "error",
          "@angular-eslint/prefer-inject": "error",
          "@angular-eslint/prefer-standalone": "error",
          "@angular-eslint/use-pipe-transform-interface": "error",
          "@angular-eslint/directive-selector": [
            "error",
            { type: "attribute", prefix: "app", style: "camelCase" },
          ],
          "@angular-eslint/component-selector": [
            "error",
            { type: "element", prefix: "app", style: "kebab-case" },
          ],
        },
      },
      {
        // The PushBased design system: `pb-*` elements and `pb*` attribute
        // components, e.g. button[pbButton].
        files: ["apps/web/src/app/design-system/**/*.ts"],
        rules: {
          "@angular-eslint/component-selector": [
            "error",
            [
              { type: "element", prefix: "pb", style: "kebab-case" },
              { type: "attribute", prefix: "pb", style: "camelCase" },
            ],
          ],
        },
      },
      {
        // `expect(obj.method).toHaveBeenCalled()` is idiomatic in specs.
        files: ["**/*.spec.ts"],
        rules: {
          "typescript/unbound-method": "off",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
