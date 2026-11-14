import { defineConfig } from 'vite-plus';

// Ports of `eslint:recommended` + `typescript-eslint/recommended`, which the
// previous Nx ESLint presets enabled.
const recommendedRules = {
  'for-direction': 'error',
  'no-async-promise-executor': 'error',
  'no-case-declarations': 'error',
  'no-compare-neg-zero': 'error',
  'no-cond-assign': 'error',
  'no-constant-binary-expression': 'error',
  'no-constant-condition': 'error',
  'no-control-regex': 'error',
  'no-debugger': 'error',
  'no-delete-var': 'error',
  'no-dupe-else-if': 'error',
  'no-duplicate-case': 'error',
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-empty-pattern': 'error',
  'no-empty-static-block': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-fallthrough': 'error',
  'no-global-assign': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-loss-of-precision': 'error',
  'no-misleading-character-class': 'error',
  'no-nonoctal-decimal-escape': 'error',
  'no-prototype-builtins': 'error',
  'no-regex-spaces': 'error',
  'no-self-assign': 'error',
  'no-shadow-restricted-names': 'error',
  'no-sparse-arrays': 'error',
  'no-unexpected-multiline': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-optional-chaining': 'error',
  'no-unused-labels': 'error',
  'no-unused-private-class-members': 'error',
  'no-unused-vars': 'warn',
  'no-useless-backreference': 'error',
  'no-useless-catch': 'error',
  'no-useless-escape': 'error',
  'require-yield': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'no-array-constructor': 'error',
  'no-unused-expressions': 'error',
  'no-empty-function': 'error',
  'typescript/adjacent-overload-signatures': 'error',
  'typescript/ban-ts-comment': 'error',
  'typescript/no-duplicate-enum-values': 'error',
  'typescript/no-empty-interface': 'error',
  'typescript/no-empty-object-type': 'error',
  'typescript/no-explicit-any': 'warn',
  'typescript/no-extra-non-null-assertion': 'error',
  'typescript/no-inferrable-types': 'error',
  'typescript/no-misused-new': 'error',
  'typescript/no-namespace': 'error',
  'typescript/no-non-null-asserted-optional-chain': 'error',
  'typescript/no-non-null-assertion': 'warn',
  'typescript/no-this-alias': 'error',
  'typescript/no-unnecessary-type-constraint': 'error',
  'typescript/no-unsafe-declaration-merging': 'error',
  'typescript/no-unsafe-function-type': 'error',
  'typescript/no-wrapper-object-types': 'error',
  'typescript/prefer-as-const': 'error',
  'typescript/prefer-namespace-keyword': 'error',
  'typescript/triple-slash-reference': 'error',
} as const;

export default defineConfig({
  test: {
    projects: ['apps/*/vite.config.mts'],
  },
  run: {
    tasks: {
      build: 'vp build apps/web',
    },
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn'],
    categories: {
      correctness: 'warn',
    },
    env: {
      builtin: true,
    },
    ignorePatterns: ['**/dist', '**/coverage'],
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      { name: '@angular-eslint', specifier: '@angular-eslint/eslint-plugin' },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    overrides: [
      {
        files: ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'],
        env: { es2020: true },
        rules: recommendedRules,
      },
      {
        files: ['**/*.{js,jsx,cjs,mjs}'],
        env: { browser: true, node: true },
      },
      {
        files: ['apps/web/src/**/*.ts'],
        rules: {
          '@angular-eslint/contextual-lifecycle': 'error',
          '@angular-eslint/no-empty-lifecycle-method': 'error',
          '@angular-eslint/no-input-rename': 'error',
          '@angular-eslint/no-inputs-metadata-property': 'error',
          '@angular-eslint/no-output-native': 'error',
          '@angular-eslint/no-output-on-prefix': 'error',
          '@angular-eslint/no-output-rename': 'error',
          '@angular-eslint/no-outputs-metadata-property': 'error',
          '@angular-eslint/prefer-inject': 'error',
          '@angular-eslint/prefer-standalone': 'error',
          '@angular-eslint/use-pipe-transform-interface': 'error',
          '@angular-eslint/directive-selector': [
            'error',
            { type: 'attribute', prefix: 'app', style: 'camelCase' },
          ],
          '@angular-eslint/component-selector': [
            'error',
            { type: 'element', prefix: 'app', style: 'kebab-case' },
          ],
        },
      },
      {
        // The PushBased design system: `pb-*` elements and `pb*` attribute
        // components, e.g. button[pbButton].
        files: ['apps/web/src/app/design-system/**/*.ts'],
        rules: {
          '@angular-eslint/component-selector': [
            'error',
            [
              { type: 'element', prefix: 'pb', style: 'kebab-case' },
              { type: 'attribute', prefix: 'pb', style: 'camelCase' },
            ],
          ],
        },
      },
      {
        // `expect(obj.method).toHaveBeenCalled()` is idiomatic in specs.
        files: ['**/*.spec.ts'],
        rules: {
          'typescript/unbound-method': 'off',
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: ['/dist', '/coverage', '.angular'],
  },
});
