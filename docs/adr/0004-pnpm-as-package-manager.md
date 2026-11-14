# 0004. pnpm as the package manager

- Status: Accepted
- Date: 2026-11-14

## Context

The repo started on npm. I wanted faster installs, less disk use and a setup that catches undeclared dependencies before they break something.

## Decision

Use pnpm, pinned to an exact version in `package.json#devEngines.packageManager` with `onFail: download`. `vp install` and CI read that pin, so everyone runs the same pnpm.

Use pnpm's workspace features:

- `apps/*` and `packages/*` are workspace packages.
- Versions that must stay aligned across packages live in the catalog in `pnpm-workspace.yaml`.
- `onlyBuiltDependencies` allowlists the few packages whose install scripts may run.

Stay on **pnpm 10**. pnpm 12, the Vite+ default, links the `typescript` peer of `@push-based/vite-plugin-ngp` to TypeScript 7 because of the plugin's own `typescript7` alias. The plugin requires TypeScript `>=6.0 <6.1` ([ADR 0005](0005-compile-angular-with-vite-plugin-ngp.md)).

## Consequences

- `node_modules` is not hoisted, so a package can only import what it declares. The build passing under pnpm showed the app had no phantom dependencies.
- Dependency install scripts do not run unless allowlisted.
- The pnpm major is a deliberate exception to the Vite+ defaults. Revisit it when the ngp plugin supports TypeScript 7.
- Within pnpm 10, keep the pin on a recent release. 10.15.0 could not re-resolve the `vite` catalog alias after a `package.json` edit.
