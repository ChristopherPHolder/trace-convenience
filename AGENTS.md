<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Trace Convenience

A browser app that turns a Chrome DevTools performance trace into images: a film strip of its screenshots, and a flame chart cut down to a time range. It is a pnpm workspace managed by Vite+.

| Package               | What it is                                                                       |
| --------------------- | -------------------------------------------------------------------------------- |
| `apps/web`            | Angular app: upload, film strip, flame chart and their exports                   |
| `packages/trace-core` | Framework-agnostic trace parsing and chart layout. No Angular, DOM or Node APIs. |

Read these before you change how something works:

- [docs/architecture.md](docs/architecture.md): packages, data flow and the `trace-core` API
- [docs/development.md](docs/development.md): commands, conventions, tests and dependencies
- [docs/adr/](docs/adr/README.md): why things are the way they are. Add an ADR when a change picks one option over another.

## Before you finish

Run `vp run ready`. It runs `vp check --deny-warnings`, every package's tests and every build, the same as CI. Lint warnings fail it.

## Do not change without reading the ADR

- **Angular, TypeScript and pnpm versions.** Angular is pinned to the exact prerelease `@push-based/vite-plugin-ngp` is built against, TypeScript stays on 6.0.x and pnpm on 10.x. See [ADR 0005](docs/adr/0005-compile-angular-with-vite-plugin-ngp.md) and [ADR 0004](docs/adr/0004-pnpm-as-package-manager.md).
- **Lint and format config.** They follow the Vite+ defaults on purpose. Do not add ESLint, Prettier or stylistic rule sets. See [ADR 0007](docs/adr/0007-vite-plus-toolchain.md).
- **`apps/web/src/styles/tokens.scss`.** It is a copy of the PushBased design tokens.

## Angular conventions

These follow the [Angular team's guidance for AI tools](https://angular.dev/ai/develop-with-ai).

- Standalone components only. Do not set `standalone: true`; it is the default.
- State lives in signals. Derive with `computed()`, update with `set` or `update`.
- `input()` and `output()` functions, not the `@Input` and `@Output` decorators.
- `inject()`, not constructor injection. Services use `providedIn: "root"`.
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Native control flow (`@if`, `@for`, `@switch`), not `*ngIf` or `*ngFor`.
- `class` and `style` bindings, not `ngClass` or `ngStyle`.
- Host bindings go in the `host` object of the decorator, not `@HostBinding` or `@HostListener`.
- Members used only by the template are `protected`. Properties Angular initialises are `readonly`.
- Name event handlers for what they do, for example `onDownload`, not `onClick`.
- Selectors: `app-` elements and `app` attributes; `pb-` and `pb` inside `apps/web/src/app/design-system`.
- Keep the UI accessible: labels on controls, keyboard support and visible focus.

## Styling

Use a component from `apps/web/src/app/design-system` before writing new button or card styles. Read colours from the semantic roles in `apps/web/src/styles.scss` (`--surface`, `--text`, `--accent`, ...), not from the raw `--color-*` tokens.

## Tests

Specs sit next to the code as `*.spec.ts`. `apps/web` specs use Vitest globals and `TestBed`. `packages/trace-core` specs import from `vite-plus/test`.
