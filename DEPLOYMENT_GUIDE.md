# Deployment Guide - GitHub Pages

This guide explains how to deploy the trace-convenience application to GitHub Pages.

## Setup Complete ✓

The following changes have been made to enable GitHub Pages deployment:

1. **Updated `apps/web/project.json`**: Added `baseHref: "/trace-convenience/"` to the production configuration
2. **Created `.github/workflows/deploy.yml`**: GitHub Actions workflow for automatic deployment

## GitHub Repository Settings

To enable deployment, you need to configure GitHub Pages in your repository:

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/ChristopherPHolder/trace-convenience
2. Click on **Settings** (top right)
3. In the left sidebar, click on **Pages** (under "Code and automation")
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions" (not "Deploy from a branch")

### Step 2: Commit and Push Changes

```bash
git add .
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

### Step 3: Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see the "Deploy to GitHub Pages" workflow running
3. Once completed (green checkmark), your site will be live at:
   - **https://christopherpholder.github.io/trace-convenience/**

## How It Works

The deployment workflow (`.github/workflows/deploy.yml`) will:

1. **Trigger** automatically on every push to the `main` branch
2. **Build** the application using `nx build web --configuration=production`
3. **Upload** the built files from `dist/apps/web/browser/`
4. **Deploy** to GitHub Pages

## Manual Deployment

You can also trigger deployment manually:

1. Go to the **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"

## Testing Locally

Before deploying, you can test the production build locally:

```bash
# Build for production
npx nx build web --configuration=production

# Serve the built files
npx nx serve-static web
```

Then open http://localhost:4200 to test the production build.

## Troubleshooting

### Build Fails

- Check the Actions tab for error logs
- Ensure all dependencies are listed in `package.json`
- Try building locally first: `npx nx build web --configuration=production`

### Site Shows 404

- Verify GitHub Pages is enabled in repository settings
- Ensure the source is set to "GitHub Actions"
- Check that the workflow completed successfully

### Assets Not Loading

- Verify `baseHref` is set correctly in `apps/web/project.json`
- Should be `/trace-convenience/` for this repository
- If you rename the repository, update the `baseHref` value

### Router Issues

If you encounter routing issues (404s on direct URL access):

1. GitHub Pages doesn't support HTML5 pushState routing by default
2. The app uses hash-based routing, so URLs will have `#` in them
3. This is already handled by your Angular configuration

## Updating the Site

Simply push changes to the `main` branch, and GitHub Actions will automatically rebuild and redeploy your site.

## Configuration Files

- **`.github/workflows/deploy.yml`**: GitHub Actions workflow
- **`apps/web/project.json`**: Build configuration with baseHref
- **Output directory**: `dist/apps/web/browser/`

## Environment Variables

If you need to add environment variables:

1. Go to repository **Settings** > **Secrets and variables** > **Actions**
2. Add your secrets
3. Reference them in `.github/workflows/deploy.yml` using `${{ secrets.YOUR_SECRET }}`

## Cost

GitHub Pages is **free** for public repositories with these limits:
- 1 GB storage
- 100 GB bandwidth per month
- 10 builds per hour

Your trace-convenience app should easily fit within these limits.

