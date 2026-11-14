# 0002. Angular signals and standalone components

- Status: Accepted
- Date: 2025-11-11

## Context

The app has a small amount of shared state: the loaded trace, the film-strip settings and whether the settings dialog is open. Most of what the UI shows is derived from that state, for example the frames left after the interval and time-range filters.

Angular offers several ways to model this: RxJS streams, a store library or signals.

## Decision

Use what current Angular provides, with no state library:

- **State** lives in `signal`s inside root-provided services (`TraceService`, `FilmStripSettingsService`). Services expose read-only signals and change state through methods.
- **Derived state** uses `computed`.
- **Components** are standalone, use `ChangeDetectionStrategy.OnPush`, take inputs with `input()` and get dependencies with `inject()`.
- **Templates** use native control flow (`@if`, `@for`).

Lint enforces the parts it can: `@angular-eslint/prefer-standalone`, `prefer-inject` and the selector prefix rules.

## Consequences

- No RxJS in application code. `rxjs` stays installed only because Angular requires it as a peer.
- Derived values recompute only when their inputs change, which suits the film strip: changing a setting re-selects the frames and nothing else.
- zone.js is still loaded (`provideZoneChangeDetection`). Because all state already flows through signals, moving to zoneless change detection later should be a small change.
