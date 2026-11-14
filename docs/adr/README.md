# Architecture decision records

An ADR captures one decision: the context it was made in, what was decided and what it costs. The guides in [`docs/`](../README.md) describe the project as it is now. The ADRs explain why.

| #                                                         | Decision                                                | Status   |
| --------------------------------------------------------- | ------------------------------------------------------- | -------- |
| [0001](0001-process-traces-in-the-browser.md)             | Process traces entirely in the browser                  | Accepted |
| [0002](0002-angular-signals-and-standalone-components.md) | Angular signals and standalone components               | Accepted |
| [0003](0003-film-strip-from-trace-screenshot-events.md)   | Build the film strip from the trace's screenshot events | Accepted |
| [0004](0004-pnpm-as-package-manager.md)                   | pnpm as the package manager                             | Accepted |
| [0005](0005-compile-angular-with-vite-plugin-ngp.md)      | Compile Angular with vite-plugin-ngp                    | Accepted |
| [0006](0006-pushbased-design-system.md)                   | PushBased design system for the UI                      | Accepted |
| [0007](0007-vite-plus-toolchain.md)                       | Vite+ as the toolchain, with its defaults               | Accepted |
| [0008](0008-single-ci-workflow-gates-pages-deploy.md)     | One CI workflow that gates the Pages deploy             | Accepted |
| [0009](0009-framework-agnostic-trace-core-package.md)     | Framework-agnostic `trace-core` package                 | Accepted |

## Adding an ADR

Write one when a change picks one option over another and the reason will not be obvious from the code later.

1. Copy the structure below into `NNNN-short-title.md`, using the next number.
2. Add it to the table above.
3. Never rewrite an accepted ADR to say something else. If a decision changes, add a new ADR and set the old one's status to `Superseded by NNNN`.

```markdown
# NNNN. Title of the decision

- Status: Accepted
- Date: YYYY-MM-DD

## Context

What problem or question led to this, and which constraints matter.

## Decision

What was decided.

## Consequences

What this makes easier, what it costs, and what to watch for.
```
