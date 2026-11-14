import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: true,
    exports: {
      // Inside the workspace, `exports` point at the TypeScript source so the app,
      // tests and type checks need no build step. `publishConfig.exports` and the
      // dist output are what Node consumers (CLI, MCP) get.
      devExports: true,
    },
  },
});
