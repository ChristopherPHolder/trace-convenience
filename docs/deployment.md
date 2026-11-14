# Deployment

The app is a static site on GitHub Pages: https://christopherpholder.github.io/trace-convenience/

Every push to `main` deploys it. There is nothing to run by hand.

## How it works

One workflow, `.github/workflows/ci.yml`, has two jobs:

1. **`ci`** runs on every push to `main` and every pull request. It runs `vp check --deny-warnings`, `vp run -r test` and `vp run -r build`. On `main` it uploads `apps/web/dist` as the Pages artifact.
2. **`deploy`** runs only on `main`, and only after `ci` has passed. It publishes the artifact that `ci` built.

So a commit that fails a check or a test is never deployed, and each push builds once. See [ADR 0008](adr/0008-single-ci-workflow-gates-pages-deploy.md).

`voidzero-dev/setup-vp` installs Vite+, Node.js (from `.node-version`) and pnpm (from `devEngines`) in CI, the same versions as locally.

## Base path

GitHub Pages serves the app from `/trace-convenience/`. `apps/web/vite.config.ts` sets `base` to that path for production builds and to `/` in development. If the repository is renamed, update `base`.

## Try the production build locally

```bash
vp run web#build && vp run web#preview
```

Then open http://localhost:4173/trace-convenience/.

## Deploy by hand

In the repository's **Actions** tab, select the **CI** workflow, click **Run workflow** and pick `main`. Other branches run the checks only.

## One-time repository setup

In **Settings → Pages**, set **Source** to **GitHub Actions**.

## Troubleshooting

| Symptom                       | Check                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| The site shows a 404          | Pages is enabled with **GitHub Actions** as the source, and the `deploy` job succeeded |
| The page loads without assets | `base` in `apps/web/vite.config.ts` matches the repository name                        |
| The `ci` job fails            | Run `vp run ready` locally. It runs the same steps.                                    |
