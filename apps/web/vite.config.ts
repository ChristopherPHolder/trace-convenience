import { defineConfig } from "vite-plus";
import { ngp } from "@push-based/vite-plugin-ngp";

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the app from /trace-convenience/.
  base: mode === "production" ? "/trace-convenience/" : "/",
  plugins: [
    ngp({
      polyfills: ["zone.js"],
      budgets: [
        { type: "initial", maximumWarning: "500kb", maximumError: "1mb" },
        {
          type: "anyComponentStyle",
          maximumWarning: "8kb",
          maximumError: "12kb",
        },
      ],
    }),
  ],
  test: {
    // Angular's TestBed registers its per-test teardown on the global
    // beforeEach/afterEach hooks, so Vitest globals stay on.
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      // Report every source file, not only the ones the tests import.
      include: ["src/**/*.ts"],
    },
  },
}));
