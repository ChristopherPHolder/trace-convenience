# 0009. Framework-agnostic `trace-core` package

- Status: Accepted
- Date: 2026-11-14

## Context

The web app is the first front end, not the only one. A CLI and an MCP server are planned. All the trace logic lived inside the Angular app, in `TraceParserService` and in about 170 lines of `computed`s in `FilmStripComponent`, so nothing outside `apps/web` could reuse it.

## Decision

Move the logic into `packages/trace-core` (`@trace-convenience/trace-core`), a pure TypeScript package with no Angular, DOM or Node APIs:

- trace parsing: `parseTrace`
- image and time helpers: `toDataUri`, `mimeTypeOf`, `formatTimestamp`, `getTimeDelta`
- frame selection: `selectFilmStripFrames`, `screenshotSpanMs`

`apps/web` depends on it with `workspace:*` and keeps UI state, rendering and canvas export.

Two guardrails keep the package portable:

- Its `tsconfig.json` sets `lib: ["es2022"]` and `types: []`, so DOM and Node globals fail the type check.
- An Oxlint `no-restricted-imports` override bans `@angular/*`, `rxjs`, `zone.js` and `node:*` under `packages/trace-core`.

The package follows the Vite+ package template: `vp pack` builds `dist` with type declarations. Inside the workspace, tsdown's `devExports` points `exports` at `src/index.ts`, so nothing has to be built first.

## Consequences

- The CLI and MCP server can import the same parser and frame selection the web app uses.
- The logic is tested without Angular or a DOM, which makes the specs fast and simple.
- Rendering stays in the app. The PNG and GIF exports draw on a browser canvas, so a Node front end needs its own renderer.
- Anything that needs the DOM or Node must live in an app, not in `trace-core`. The guardrails fail the check if that rule is broken.
