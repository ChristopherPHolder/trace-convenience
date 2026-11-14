# 0008. One CI workflow that gates the Pages deploy

- Status: Accepted
- Date: 2026-11-14

## Context

CI and the GitHub Pages deploy were two workflows. Both ran on a push to `main`, independently, so a commit that failed its checks could still be deployed, and every push built the app twice.

## Decision

Keep one workflow, `.github/workflows/ci.yml`, with two jobs:

- `ci` checks, tests and builds on every pull request and every push to `main`. On `main` it uploads `apps/web/dist` as the Pages artifact.
- `deploy` `needs: ci`, runs only on `main`, and publishes the artifact `ci` built.

Supporting choices:

- Superseded pull request runs are cancelled. A push to `main` is never cancelled mid-deploy.
- The workflow has `contents: read`. Only `deploy` gets `pages: write` and `id-token: write`.
- `setup-vp` is pinned to an exact version, and Dependabot updates the GitHub Actions weekly in one grouped pull request.

## Consequences

- A failing `main` cannot deploy, and what is deployed is exactly what was tested.
- Each push builds once.
- There is no staging environment or preview deploy for pull requests. `vp run web#preview` covers that locally.
- The Vite Task cache is not restored between CI runs. The tasks take seconds, and the Vite+ docs advise measuring before adding it.
