# 0006. PushBased design system for the UI

- Status: Accepted
- Date: 2026-11-14

## Context

The first UI had its own colours and component styles, written per component. It did not share a look with other PushBased tools, and every new screen meant new one-off styles.

## Decision

Build the UI on the PushBased design system:

- `apps/web/src/styles/tokens.scss` holds the PushBased tokens unchanged.
- `apps/web/src/styles.scss` maps the tokens to semantic roles (`--surface`, `--text`, `--accent`, `--danger-bg`, ...), each with a light and a dark value. The app follows the system colour scheme.
- Components read the semantic roles only, never the raw `--color-*` tokens.
- `apps/web/src/app/design-system/` holds the Angular components: `pbButton`, `pbIconButton`, `pb-card`, `pb-badge`, `pb-notice`, `pbSwitch`, `pb-spinner`, `pbHeading`, `pbEyebrow` and `pbDescription`. Global `.pb-*` classes cover plain elements such as inputs.
- Geist and Geist Mono are self-hosted through `@fontsource`, so the app makes no third-party font requests.

Lint allows the `pb` selector prefix inside `design-system/` only. The rest of the app uses `app`.

## Consequences

- A colour change is one edit in `styles.scss`, and both themes keep working.
- `tokens.scss` can be replaced with a newer copy from the design system without touching components.
- The design-system components live in the app for now. If another front end needs them, they move to a workspace package.
- The PNG and GIF exports draw on a canvas with their own colours and do not follow the theme.
