# trace-core

Framework-agnostic trace logic shared by every Trace Convenience front end (web today, CLI and MCP next).

- `parseTrace(json)` extracts screenshots and timing metadata from a Chrome DevTools trace.
- `selectFilmStripFrames(screenshots, options)` picks film-strip frames with an optional time window and fixed-interval sampling.
- Helpers: `toDataUri`, `mimeTypeOf`, `formatTimestamp`, `getTimeDelta`, `screenshotSpanMs`.
- `parseFlameChart(json)` builds the main thread's flame chart: the trace events DevTools draws, with the JavaScript frames of the CPU profile nested inside them.
- `layoutFlameChart(chart, options)` places the bars of a time range, and `renderFlameChartSvg(layout)` draws them as a standalone SVG.

```ts
import {
  layoutFlameChart,
  parseFlameChart,
  renderFlameChartSvg,
} from "@trace-convenience/trace-core";

const chart = parseFlameChart(JSON.parse(traceJson));
const layout = layoutFlameChart(chart, { timeRange: { startMs: 9900, endMs: 10650 } });
const svg = renderFlameChartSvg(layout);
```

No Angular, DOM or Node APIs are allowed here, so it runs in the browser and in Node. The `no-restricted-imports` override in the root `vite.config.ts` and the `lib: ["es2022"]` / `types: []` tsconfig enforce this.

```sh
vp run trace-core#test    # run the specs
vp run trace-core#build   # vp pack: dist/index.mjs + dist/index.d.mts
```

Inside the workspace, `exports` point at `src/index.ts` (tsdown `devExports`), so consumers need no build step. `publishConfig.exports` points at `dist`.
