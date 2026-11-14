# trace-core

Framework-agnostic trace logic shared by every Trace Convenience front end (web, CLI, MCP).

- `parseTrace(json)` extracts screenshots and timing metadata from a Chrome DevTools trace.
- `selectFilmStripFrames(screenshots, options)` picks film-strip frames with an optional time window and fixed-interval sampling.
- Helpers: `toDataUri`, `mimeTypeOf`, `formatTimestamp`, `getTimeDelta`, `screenshotSpanMs`.

No Angular, DOM or Node APIs are allowed here (enforced by lint and the `lib` setting in `tsconfig.json`), so it runs in the browser and in Node.

```sh
nx test trace-core
nx typecheck trace-core
```
