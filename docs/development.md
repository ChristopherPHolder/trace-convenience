# Development

## Setup

Install [Vite+](https://viteplus.dev) (`vp`):

```bash
curl -fsSL https://vite.plus | bash
```

Then, in the repo:

```bash
vp install
```

`vp install` provisions Node.js (pinned in `.node-version`) and pnpm (pinned in `package.json#devEngines`), installs the dependencies and sets up the pre-commit hook. You do not need Node.js, pnpm or nvm installed yourself.

## Commands

Run these from the repo root.

| Command                  | What it does                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| `vp run dev`             | Dev server for the web app at http://localhost:5173                      |
| `vp check`               | Format check, lint and type check                                        |
| `vp check --fix`         | Same, and fixes what it can                                              |
| `vp test`                | Runs every package's tests. In a terminal it watches for changes.        |
| `vp test film-strip`     | Runs the test files whose path matches `film-strip`                      |
| `vp test --coverage`     | Tests with a coverage report                                             |
| `vp run trace-core#test` | One package's tests, run once                                            |
| `vp run -r build`        | Builds every package                                                     |
| `vp run web#build`       | Production build of the app into `apps/web/dist`                         |
| `vp run web#preview`     | Serves that build at http://localhost:4173/trace-convenience/            |
| `vp run ready`           | Everything CI runs: `vp check --deny-warnings`, all tests and all builds |

`vp <name>` is a built-in Vite+ command. `vp run <name>` runs a `package.json` script, and `vp run <package>#<script>` runs one package's script. Task results are cached, so an unchanged task is skipped.

Run `vp run ready` before you open a pull request.

## Conventions

**Formatting and linting.** Oxfmt and Oxlint run with the Vite+ defaults. The pre-commit hook runs `vp check --fix` on staged files. CI runs `vp check --deny-warnings`, so a lint warning fails the build.

**Angular.** The lint rules in the root `vite.config.ts` enforce the basics:

- Standalone components, `inject()` instead of constructor injection, and no renamed inputs or outputs
- Selectors: `app-` elements and `app` attributes in the app; `pb-` elements and `pb` attributes inside `design-system/`

Beyond what lint checks: keep state in signals, derive with `computed`, use `input()` and `output()`, native control flow (`@if`, `@for`) and `ChangeDetectionStrategy.OnPush`. Oxlint does not lint Angular templates. Template type errors are caught by the ngp type check during `vp build`.

**trace-core.** No Angular, DOM or Node APIs. Lint and the package's `tsconfig.json` reject them. See [Architecture](architecture.md#trace-core).

**Styling.** Use a component from `apps/web/src/app/design-system` before writing new button or card styles. Read colours from the semantic roles in `styles.scss` (`--surface`, `--text`, `--accent`, ...), not from the raw `--color-*` tokens. Leave `styles/tokens.scss` as it is so it stays in sync with the PushBased design system.

## Tests

Specs live next to the code as `*.spec.ts`.

- **`apps/web`** runs in jsdom with Vitest globals on, because Angular's `TestBed` registers its teardown on the global `beforeEach` and `afterEach`. `src/test-setup.ts` loads zone.js and initialises the test environment.
- **`packages/trace-core`** imports `describe`, `it` and `expect` from `vite-plus/test` and needs no DOM.

## Dependencies

Add and remove dependencies with `vp`, scoped to a package:

```bash
vp add <package> --filter web
vp add -D <package> --filter @trace-convenience/trace-core
vp remove <package> --filter web
```

The workspace uses `catalogMode: prefer`, the Vite+ default. `vp add` saves a new dependency's version to the catalog in `pnpm-workspace.yaml` and writes `catalog:` in the package's `package.json`. Versions that must stay aligned across packages, such as `vite-plus`, `typescript` and `vitest`, live there too.

Some versions are pinned on purpose:

- **Angular** is pinned to the exact prerelease that `@push-based/vite-plugin-ngp` is built against.
- **TypeScript** stays on 6.0.x, which the plugin requires.
- **pnpm** stays on 10.x. pnpm 12 links the plugin's `typescript` peer to TypeScript 7.

See [ADR 0005](adr/0005-compile-angular-with-vite-plugin-ngp.md) before changing any of them. To update Vite+ itself, run `vp migrate`, which keeps `vite-plus`, the `vite` alias and the `vitest` pin aligned.

## How to

### Support another screenshot event

1. Add the event to the loop in `packages/trace-core/src/parse-trace.ts`. Use `extractBase64FromDataUri` and `detectImageFormat` from `image.ts` for the image data.
2. Add cases to `packages/trace-core/src/parse-trace.spec.ts`.
3. Add the event to the table in [Architecture](architecture.md#trace-core).

### Show more data per frame

1. Add the field to `Screenshot` in `packages/trace-core/src/types.ts` and fill it in `parseTrace`.
2. `selectFilmStripFrames` passes it through on each `FilmStripFrame`.
3. Render it in `apps/web/src/app/components/film-strip/film-strip.html`.

### Show another trace event in the flame chart

1. Add the event's name, label and category to `packages/trace-core/src/flame-chart/event-styles.ts`. Use the label and category DevTools gives it in `front_end/models/trace/Styles.ts` of [devtools-frontend](https://github.com/ChromeDevTools/devtools-frontend).
2. If it runs JavaScript, add it to `isJsInvocation` in the same file, so that CPU profile samples inside it become JavaScript frames.
3. Add a case to `parse-flame-chart.spec.ts`.

### Change how the flame chart looks

1. Positions, labels, ticks and anything else that needs a decision go in `layoutFlameChart` (`packages/trace-core/src/flame-chart/layout.ts`), with a case in `layout.spec.ts`.
2. Colours and fonts shared by both renderers go in `FLAME_CHART_STYLE` (`style.ts`).
3. Draw the change twice: in `renderFlameChartSvg` (`svg.ts`) for the export and in `apps/web/src/app/components/flame-chart/flame-chart.html` for the page. See [ADR 0011](adr/0011-flame-chart-laid-out-in-trace-core.md).

### Add a tool

1. Add its id and label to `TOOLS` in `apps/web/src/app/components/trace-tools/trace-tools.ts`, and a `@case` for its component in `trace-tools.html`.
2. Keep its state in a service that reads `TraceService`, so it survives switching tabs.
3. Put trace logic in `trace-core`, not in the component.

### Try the WebMCP tools

WebMCP is behind a flag in Chrome 149 and later.

1. Open `chrome://flags/#enable-webmcp-testing`, enable it and relaunch Chrome.
2. Run `vp run dev` and open the app.
3. Open DevTools, then **Application** > **WebMCP**. The three tools are listed under **Available tools**, and each has a **Run tool** button.

An agent connected through [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) can call them with `list_webmcp_tools` and `execute_webmcp_tool`, which it enables with `--categoryExperimentalWebmcp`.

### Add a WebMCP tool

1. Add a `WebMcpToolDescriptor` to `apps/web/src/app/webmcp/film-strip-tools.ts` and to the `filmStripTools` array.
2. In `execute`, call `inject()` before the first `await`, check every argument, and throw a `ToolError` for anything the agent can fix. Wrap `execute` in `reportingErrors` so the message is returned to the agent.
3. Change state through the services the UI uses, so the page shows what the tool did.
4. Add cases to `film-strip-tools.spec.ts`, and the tool to the table in [Architecture](architecture.md#webmcp-tools).

### Record a decision

Add an ADR when a change picks one option over another and the reason will not be obvious from the code. See [the ADR index](adr/README.md).

## Pull requests

1. Open an issue that describes the problem.
2. Open a pull request that closes it. Keep it to one change.
3. CI must pass. It runs the same steps as `vp run ready`.

Pull requests are squash-merged.
