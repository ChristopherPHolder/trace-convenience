# 0005. Compile Angular with vite-plugin-ngp

- Status: Accepted
- Date: 2026-11-14

## Context

The app was built with `@angular/build` and tested through `@analogjs/vite-plugin-angular`. That meant two build pipelines with separate configuration, and the Angular CLI in between the app and Vite.

[`@push-based/vite-plugin-ngp`](https://push-based.github.io/vite-plugin-ngp/) compiles Angular inside Vite with ngp, Angular's hybrid Rust/TypeScript preprocessor, one module at a time.

## Decision

Build, serve and test the app with Vite and `@push-based/vite-plugin-ngp`. One `apps/web/vite.config.ts` covers all three, and the code is AOT-compiled everywhere, including the specs.

The plugin takes over what the Angular builder did: the `zone.js` polyfill, the bundle budgets and the type check of TypeScript and templates during the build.

## Consequences

- No Angular CLI, no `angular.json` and no `ng` commands. The app is a plain Vite app.
- The plugin sets hard version requirements. These pins are deliberate and should not be bumped on their own:
  - Every `@angular/*` package is pinned to the exact prerelease the plugin is built against.
  - TypeScript must be `>=6.0 <6.1`.
  - Node.js 26 or later.
- The ngp build inside the plugin is not an official Angular release. Angular stays on a `next` prerelease until the plugin moves to a newer one.
- The plugin reads `tsconfig.app.json` for the app and `tsconfig.spec.json` under Vitest, which is why `apps/web` keeps the Angular-style tsconfig split.
- There is no i18n extraction target. The app has no translations.
