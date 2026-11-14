/// <reference types='vite-plus/test' />
import { defineConfig } from 'vite-plus';
import { ngp } from '@push-based/vite-plugin-ngp';

export default defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  // GitHub Pages serves the app from /trace-convenience/.
  base: mode === 'production' ? '/trace-convenience/' : '/',
  server: {
    port: 4200,
  },
  build: {
    outDir: '../../dist/apps/web/browser',
    emptyOutDir: true,
    sourcemap: mode !== 'production',
  },
  plugins: [
    ngp({
      polyfills: ['zone.js'],
      budgets: [
        { type: 'initial', maximumWarning: '500kb', maximumError: '1mb' },
        {
          type: 'anyComponentStyle',
          maximumWarning: '8kb',
          maximumError: '12kb',
        },
      ],
    }),
  ],
  test: {
    name: 'web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      include: ['src/**/*.ts'],
      reportsDirectory: '../../coverage/apps/web',
      provider: 'v8' as const,
    },
  },
}));
