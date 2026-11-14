import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // The PushBased design system: `pb-*` elements and `pb*` attribute components, e.g. button[pbButton].
    files: ['src/app/design-system/**/*.ts'],
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
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
