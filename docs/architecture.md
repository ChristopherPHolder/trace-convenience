# Architecture

Trace Convenience is a pnpm workspace managed by [Vite+](https://viteplus.dev). It has two packages:

| Package               | Name                            | Role                                                                |
| --------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `packages/trace-core` | `@trace-convenience/trace-core` | Trace parsing, frame selection and chart layout, in pure TypeScript |
| `apps/web`            | `web`                           | The Angular app: UI state, rendering and export                     |

The split exists so that other front ends can reuse the trace logic. A CLI and an MCP server are planned. See [ADR 0009](adr/0009-framework-agnostic-trace-core-package.md).

## From trace file to film strip

```
file drop / file picker
        │  FileReader + JSON.parse            apps/web  FileUploadComponent
        ▼
TraceService.addFile(file, json)              apps/web  signal store
        │  parseTrace(json)                   trace-core
        ▼
ParsedTrace { screenshots, metadata }
        │  selectFilmStripFrames(screenshots, { timeRange, intervalMs })   trace-core
        ▼
FilmStripFrame[]                              apps/web  FilmStripService
        │
        ├─ rendered as the strip and the preview          FilmStripComponent
        ├─ drawn on a canvas for the PNG and GIF downloads   FilmStripExportService
        └─ reported to in-browser agents                  WebMCP tools
```

Everything runs in the browser. There is no backend and no persistence. See [ADR 0001](adr/0001-process-traces-in-the-browser.md).

## From trace file to flame chart

The flame chart reads the same loaded file, the first time its tab is opened.

```
TraceService.currentFile().content            apps/web  the decoded trace
        │  parseFlameChart(json)              trace-core
        ▼
FlameChart { entries, startTime, endTime }    the main thread, in call-tree order
        │  layoutFlameChart(chart, { timeRange, width })   trace-core
        ▼
FlameChartLayout { bars, ticks, ... }         apps/web  FlameChartService
        │
        ├─ rendered as inline SVG                         FlameChartComponent
        └─ renderFlameChartSvg(layout)        trace-core
                ├─ downloaded as the SVG                  FlameChartExportService
                └─ drawn on a canvas for the PNG          FlameChartExportService
```

`parseFlameChart` does what the Performance panel of Chrome DevTools does for its main-thread track. See [ADR 0011](adr/0011-flame-chart-laid-out-in-trace-core.md).

1. It picks the busiest `CrRendererMain` thread among the processes that host the page's outermost frame.
2. It keeps the trace events DevTools draws and gives them its labels and category colours. `flame-chart/event-styles.ts` holds the table.
3. It joins the `Profile` and `ProfileChunk` events into a CPU profile and turns the samples into JavaScript calls that fit inside the trace events. `flame-chart/cpu-profile.ts` holds the rules.
4. It nests everything by time and gives each entry a depth and a self time.

`layoutFlameChart` decides where everything goes: the position and colour of each bar, the label cut to fit it, the axis ticks and the marks on long tasks. `renderFlameChartSvg` and the component's template only draw what the layout says, so the page and the export agree.

## trace-core

Source: `packages/trace-core/src`.

| Export                                         | Purpose                                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseTrace(traceContent)`                     | Extracts screenshots from an already JSON-decoded trace, sorted by timestamp, with start, end, duration and count. Throws on input that is not a trace object. |
| `selectFilmStripFrames(screenshots, options?)` | Picks the frames to show. `timeRange` limits them to a window plus one context frame on each side. `intervalMs` re-samples onto a fixed timeline.              |
| `screenshotSpanMs(screenshots)`                | Time between the first and last screenshot, in milliseconds                                                                                                    |
| `toDataUri(screenshot)`, `mimeTypeOf(format)`  | Turn a screenshot into something an `<img>` can show                                                                                                           |
| `formatTimestamp(timestamp, base?)`            | Formats a microsecond timestamp as `123ms` or `1.23s`                                                                                                          |
| `getTimeDelta(current, previous)`              | Milliseconds between two screenshots                                                                                                                           |
| `Screenshot`, `ParsedTrace`, `FilmStripFrame`  | The data types. Timestamps are in microseconds, as in the trace. Image data is base64 without a data-URI prefix.                                               |

The flame chart exports are in `src/flame-chart`:

| Export                                                               | Purpose                                                                                                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseFlameChart(traceContent)`                                      | Builds the main thread's flame chart from an already JSON-decoded trace. Throws on input that is not a trace; an empty chart has no entries. |
| `flameChartDurationMs(chart)`                                        | Length of the trace, in milliseconds                                                                                                         |
| `layoutFlameChart(chart, options?)`                                  | Places the entries of a `timeRange` in a chart `width` px wide. Options turn off the axis, the labels or the durations and limit the depth.  |
| `renderFlameChartSvg(layout)`                                        | Draws a layout as a standalone SVG document                                                                                                  |
| `snapTimeRangeToTasks(chart, timeRange)`                             | Widens a range to the top-level tasks it touches                                                                                             |
| `clampTimeRange(chart, timeRange?)`                                  | Keeps a range inside the trace and in order                                                                                                  |
| `formatDuration(microseconds)`                                       | Formats a duration as `450 μs`, `12.3 ms` or `1.25 s`                                                                                        |
| `FLAME_CHART_STYLE`                                                  | The font and colours a renderer needs to draw a layout                                                                                       |
| `FlameChart`, `FlameChartEntry`, `FlameChartLayout`, `FlameChartBar` | The data types. A chart's times are in microseconds; a layout's positions are in px and its time range in milliseconds.                      |

`parseTrace` reads three kinds of trace events. See [ADR 0003](adr/0003-film-strip-from-trace-screenshot-events.md).

| Event                                                                  | Where the image is            |
| ---------------------------------------------------------------------- | ----------------------------- |
| `Screenshot` in the `disabled-by-default-devtools.screenshot` category | `args.snapshot`, raw base64   |
| `ScreencastFrame`                                                      | `args.dataUri` or `args.data` |
| `CaptureFrame`                                                         | `args.data`                   |

The package must run in the browser and in Node, so it uses no Angular, DOM or Node APIs. Two guardrails enforce that:

- Its `tsconfig.json` has `lib: ["es2022"]` and `types: []`, so `document` or `process` fail the type check.
- A `no-restricted-imports` override in the root `vite.config.ts` bans `@angular/*`, `rxjs`, `zone.js` and `node:*` imports.

Inside the workspace the package's `exports` point at `src/index.ts`, so the app, the tests and the type check use the source without a build step. `vp pack` produces `dist` with type declarations for consumers outside the workspace.

## apps/web

```
apps/web/src/
├── main.ts                      Bootstraps the app
├── styles.scss                  Semantic colour roles (light and dark) and global .pb-* classes
├── styles/tokens.scss           PushBased design tokens
└── app/
    ├── app.ts, app.html         Shell: header and the upload screen
    ├── components/
    │   ├── file-upload/                  Drop zone, validation, file card; hosts the tools
    │   ├── trace-tools/                  One tab per tool; renders the selected one
    │   ├── film-strip/                   Strip, preview, PNG and GIF export
    │   ├── film-strip-settings-dialog/   Interval, time range and timestamp settings
    │   └── flame-chart/                  Overview with the range selection, chart, SVG and PNG export
    ├── services/
    │   ├── trace.service.ts              The loaded trace and its parsed data
    │   ├── film-strip-settings.service.ts   Settings shared by the strip and the dialog
    │   ├── film-strip.service.ts         The frames the settings select
    │   ├── film-strip-export.service.ts  PNG and GIF download
    │   ├── flame-chart.service.ts        The main thread's chart, its time range and its layout
    │   ├── flame-chart-export.service.ts SVG and PNG download
    │   └── download.ts                   Saves a blob as a file
    ├── webmcp/
    │   └── film-strip-tools.ts           The tools published to in-browser agents
    └── design-system/           PushBased components (pbButton, pb-card, pbSwitch, ...)
```

**State.** Services hold state in Angular signals and expose it read-only. Components derive what they show with `computed`, and use `ChangeDetectionStrategy.OnPush`. See [ADR 0002](adr/0002-angular-signals-and-standalone-components.md).

**Frames.** `FilmStripService` applies the interval and time-range settings to the loaded trace's screenshots. The strip component and the WebMCP tools both go through it, so they always show the same frames.

**Export.** `FilmStripExportService` draws the frames on a canvas and downloads the result. The PNG is one image with the frames side by side. The GIF is encoded with [gifenc](https://github.com/mattdesl/gifenc), which is loaded with a dynamic `import()` so it stays out of the initial bundle.

**Tools.** `TraceToolsComponent` shows one tab per tool and renders only the selected one. The selected tool is a signal in the component; there is no router.

**Flame chart.** `FlameChartService` parses the main thread when the flame chart is first shown, holds the time range and computes two layouts: the chart, cut to the range, and an overview of the whole trace to choose the range on. Loading another trace resets the range. `FlameChartComponent` renders both as inline SVG. The chart is always laid out 1200 px wide and scaled to the page, so an export does not depend on the window's size.

**Styling.** The UI uses the PushBased design system. `tokens.scss` holds the raw tokens and `styles.scss` maps them to semantic roles such as `--surface`, `--text` and `--accent`, each with a light and a dark value. Components read the semantic roles only. See [ADR 0006](adr/0006-pushbased-design-system.md).

## WebMCP tools

The app publishes three tools to agents that run in the browser, through [WebMCP](https://webmachinelearning.github.io/webmcp/). See [ADR 0010](adr/0010-webmcp-tools-for-the-film-strip.md).

| Tool                         | What it does                                                 | Returns                                                         |
| ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| `get_film_strip_state`       | Reads the loaded trace and the settings                      | File name, screenshot count, duration, settings and frame times |
| `update_film_strip_settings` | Sets the interval, the time range or whether timestamps show | The state after the change                                      |
| `export_film_strip`          | Downloads the displayed frames as `png` or `gif`             | File name, frame count and pixel size                           |

`app.config.ts` registers them with Angular's `provideExperimentalWebMcpTools`. It registers the tools when the app starts and does nothing in a browser without `document.modelContext`. Each tool's `execute` runs in the app's injection context, so it reads and writes the same services as the UI, and the page updates as the agent works.

A tool that cannot do what it was asked returns `{ error: "..." }` in place of its result. Chrome swaps a thrown error for a generic failure, so a thrown message would never reach the agent.

Times are in milliseconds from the first screenshot, in both input and output. A tool never returns image data.

WebMCP is behind a flag in Chrome. See [Try the WebMCP tools](development.md#try-the-webmcp-tools).

## Toolchain

One tool, `vp`, runs everything:

| Concern              | Tool                                                                                            | Config                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Dev server and build | Vite, with Angular compiled by [vite-plugin-ngp](https://push-based.github.io/vite-plugin-ngp/) | `apps/web/vite.config.ts`                  |
| Library build        | `vp pack` (tsdown)                                                                              | `packages/trace-core/vite.config.ts`       |
| Tests                | Vitest, with jsdom for the app                                                                  | `test` in each `vite.config.ts`            |
| Lint and type check  | Oxlint with type-aware rules, plus angular-eslint as a JS plugin                                | `lint` in the root `vite.config.ts`        |
| Format               | Oxfmt with its defaults                                                                         | `fmt` in the root `vite.config.ts`         |
| Tasks and caching    | Vite Task (`vp run`)                                                                            | `run` in the root `vite.config.ts`         |
| Node.js and pnpm     | `vp env`                                                                                        | `.node-version`, `package.json#devEngines` |
| Shared versions      | pnpm catalog                                                                                    | `pnpm-workspace.yaml`                      |

See [ADR 0007](adr/0007-vite-plus-toolchain.md) for the toolchain and [ADR 0005](adr/0005-compile-angular-with-vite-plugin-ngp.md) for the Angular compiler.
