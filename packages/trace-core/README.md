# trace-core

Framework-agnostic trace logic shared by every Trace Convenience front end (web today, CLI and MCP next).

- `parseTrace(json)` extracts screenshots and timing metadata from a Chrome DevTools trace.
- `selectFilmStripFrames(screenshots, options)` picks film-strip frames with an optional time window and fixed-interval sampling.
- Helpers: `toDataUri`, `mimeTypeOf`, `formatTimestamp`, `getTimeDelta`, `screenshotSpanMs`.

No Angular, DOM or Node APIs are allowed here, so it runs in the browser and in Node. The `no-restricted-imports` override in the root `vite.config.ts` and the `lib: ["es2022"]` / `types: []` tsconfig enforce this.

```sh
vp run trace-core#test    # run the specs
vp run trace-core#build   # vp pack: dist/index.mjs + dist/index.d.mts
```

Inside the workspace, `exports` point at `src/index.ts` (tsdown `devExports`), so consumers need no build step. `publishConfig.exports` points at `dist`.
