/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/trace-core',
  plugins: [nxReadySignal()],
  test: {
    name: 'trace-core',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      include: ['src/**/*.ts'],
      reportsDirectory: '../../coverage/libs/trace-core',
      provider: 'v8' as const,
    },
  },
}));
