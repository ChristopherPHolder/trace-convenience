# Architecture

Trace Convenience is a pnpm workspace managed by [Vite+](https://viteplus.dev). It has two packages:

| Package               | Name                            | Role                                                             |
| --------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `packages/trace-core` | `@trace-convenience/trace-core` | Trace parsing and film-strip frame selection, in pure TypeScript |
| `apps/web`            | `web`                           | The Angular app: UI state, rendering and export                  |

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
FilmStripFrame[]                              apps/web  FilmStripComponent
        │
        ├─ rendered as the strip and the preview
        └─ drawn on a canvas for the PNG and GIF downloads
```

Everything runs in the browser. There is no backend and no persistence. See [ADR 0001](adr/0001-process-traces-in-the-browser.md).

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
    │   ├── file-upload/                  Drop zone, validation, file card; hosts the film strip
    │   ├── film-strip/                   Strip, preview, PNG and GIF export
    │   └── film-strip-settings-dialog/   Interval, time range and timestamp settings
    ├── services/
    │   ├── trace.service.ts              The loaded trace and its parsed data
    │   └── film-strip-settings.service.ts   Settings shared by the strip and the dialog
    └── design-system/           PushBased components (pbButton, pb-card, pbSwitch, ...)
```

**State.** Services hold state in Angular signals and expose it read-only. Components derive what they show with `computed`, and use `ChangeDetectionStrategy.OnPush`. See [ADR 0002](adr/0002-angular-signals-and-standalone-components.md).

**Export.** `FilmStripComponent` draws the visible frames on a canvas. The PNG is one image with the frames side by side. The GIF is encoded with [gifenc](https://github.com/mattdesl/gifenc), which is loaded with a dynamic `import()` so it stays out of the initial bundle.

**Styling.** The UI uses the PushBased design system. `tokens.scss` holds the raw tokens and `styles.scss` maps them to semantic roles such as `--surface`, `--text` and `--accent`, each with a light and a dark value. Components read the semantic roles only. See [ADR 0006](adr/0006-pushbased-design-system.md).

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
