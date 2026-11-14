# Deployment Guide - GitHub Pages

This guide explains how to deploy the trace-convenience application to GitHub Pages.

## Overview

- **`apps/web/vite.config.ts`** sets `base: '/trace-convenience/'` for production builds.
- **`.github/workflows/ci.yml`** checks, tests and builds every push and pull request. On `main` it also deploys the build to GitHub Pages.

## GitHub Repository Settings

To enable deployment, you need to configure GitHub Pages in your repository:

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/ChristopherPHolder/trace-convenience
2. Click on **Settings** (top right)
3. In the left sidebar, click on **Pages** (under "Code and automation")
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions" (not "Deploy from a branch")

### Step 2: Monitor Deployment

1. Push to `main` (or merge a pull request)
2. Go to the **Actions** tab and open the "CI" run
3. Once completed (green checkmark), your site will be live at:
   - **https://christopherpholder.github.io/trace-convenience/**

## How It Works

The CI workflow (`.github/workflows/ci.yml`) will:

1. **Check, test and build** with `vp check --deny-warnings`, `vp run -r test` and `vp run -r build` (Vite+, production mode)
2. **Upload** the built files from `apps/web/dist/` (only on `main`)
3. **Deploy** to GitHub Pages in a separate `deploy` job, which only runs once the `ci` job has passed

A commit that fails checks or tests is never deployed.

## Manual Deployment

You can also trigger deployment manually:

1. Go to the **Actions** tab
2. Select the "CI" workflow
3. Click "Run workflow"
4. Select `main` and click "Run workflow" (other branches run checks only)

## Testing Locally

Before deploying, you can test the production build locally:

```bash
# Build for production and serve the built files
vp run web#build && vp run web#preview
```

Then open http://localhost:4173/trace-convenience/ to test the production build.

## Troubleshooting

### Build Fails

- Check the Actions tab for error logs
- Ensure all dependencies are listed in `package.json`
- Try building locally first: `vp run web#build`

### Site Shows 404

- Verify GitHub Pages is enabled in repository settings
- Ensure the source is set to "GitHub Actions"
- Check that the workflow completed successfully

### Assets Not Loading

- Verify `base` is set correctly in `apps/web/vite.config.ts`
- Should be `/trace-convenience/` for this repository
- If you rename the repository, update the `base` value

### Router Issues

If you encounter routing issues (404s on direct URL access):

1. GitHub Pages doesn't support HTML5 pushState routing by default
2. The app uses hash-based routing, so URLs will have `#` in them
3. This is already handled by your Angular configuration

## Updating the Site

Simply push changes to the `main` branch, and GitHub Actions will automatically rebuild and redeploy your site.

## Configuration Files

- **`.github/workflows/ci.yml`**: CI and GitHub Pages deployment
- **`apps/web/vite.config.ts`**: Build configuration with the `base` path
- **Output directory**: `apps/web/dist/`

## Environment Variables

If you need to add environment variables:

1. Go to repository **Settings** > **Secrets and variables** > **Actions**
2. Add your secrets
3. Reference them in `.github/workflows/ci.yml` using `${{ secrets.YOUR_SECRET }}`

## Cost

GitHub Pages is **free** for public repositories with these limits:

- 1 GB storage
- 100 GB bandwidth per month
- 10 builds per hour

Your trace-convenience app should easily fit within these limits.
