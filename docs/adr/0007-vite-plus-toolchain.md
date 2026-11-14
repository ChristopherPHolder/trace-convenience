# 0007. Vite+ as the toolchain, with its defaults

- Status: Accepted
- Date: 2026-11-14

## Context

The repo was generated as an Nx workspace with ESLint, Prettier and separate Vite and Vitest configs. For one app and one library that was a lot of tooling: `nx.json`, `project.json`, two ESLint configs, Prettier config and 18 dev dependencies that existed only for that tooling.

[Vite+](https://viteplus.dev) puts the runtime, the package manager, dev, build, test, lint, format and task running behind one CLI, `vp`, configured in `vite.config.ts`.

## Decision

Use Vite+ for everything, and stay as close as possible to what `vp create vite:monorepo` generates. When a carried-over setting and a Vite+ default disagree, take the default.

- **Runtime and package manager:** `vp env` provisions Node.js from `.node-version` and pnpm from `devEngines`.
- **Layout:** `apps/*` and `packages/*` workspace packages, each with its own scripts. The root holds tooling only.
- **Tasks:** `vp run` with caching on. `vp run ready` is the one command that proves a change is good.
- **Lint:** Oxlint's defaults with type-aware rules and type checking, not a port of the ESLint presets.
- **Format:** Oxfmt's defaults (`fmt: {}`), not the old Prettier options.
- **Git hooks:** `vp config` installs the hook dispatcher, and pre-commit runs `vp staged`.
- **CI:** `voidzero-dev/setup-vp`, then the same steps as `vp run ready`.

The deliberate differences from the scaffold:

| Difference                                           | Why                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| pnpm 10 instead of 12                                | The ngp plugin's TypeScript peer ([ADR 0004](0004-pnpm-as-package-manager.md))                   |
| TypeScript 6.0 instead of 7                          | Required by the ngp plugin ([ADR 0005](0005-compile-angular-with-vite-plugin-ngp.md))            |
| angular-eslint rules through an Oxlint JS plugin     | Oxlint has no Angular rules of its own                                                           |
| `vp check --deny-warnings` in CI and `ready`         | Oxlint reports its correctness rules as warnings, and `vp check` passes on warnings              |
| Vitest globals, jsdom and a setup file in `apps/web` | Angular's `TestBed` needs them                                                                   |
| `test.projects` in the root config                   | So `vp test` from the root runs every package's tests                                            |
| `no-restricted-imports` override for `trace-core`    | Keeps the package framework-agnostic ([ADR 0009](0009-framework-agnostic-trace-core-package.md)) |

## Consequences

- One install (`vp`) and one command (`vp install`) set up a working checkout. Contributors do not manage Node.js or pnpm themselves.
- One config file per package replaces the Nx, ESLint, Prettier and Vitest configs.
- Updating the toolchain is one version: `vp migrate` re-pins `vite-plus`, the `vite` alias and `vitest` together.
- Oxlint does not lint Angular HTML templates, so the angular-eslint template rules are gone. Template type errors are still caught by the ngp type check during the build.
- Stylistic rules from the old ESLint presets, such as `prefer-const` and `no-explicit-any`, no longer run. They are outside Oxlint's default `correctness` category.
- There are no Nx module boundaries. The `trace-core` lint override and its `tsconfig.json` do that job.
