# Trace Convenience

Turn a Chrome DevTools performance trace into a film strip of its screenshots, then download the strip as a PNG or an animated GIF.

[![CI](https://github.com/ChristopherPHolder/trace-convenience/actions/workflows/ci.yml/badge.svg)](https://github.com/ChristopherPHolder/trace-convenience/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live app:** https://christopherpholder.github.io/trace-convenience/

The trace never leaves your browser. It is parsed and rendered locally, and nothing is uploaded to a server.

## Use it

1. In Chrome DevTools, open the **Performance** panel and enable **Screenshots** in the capture settings (the gear icon).
2. Record, stop, and save the trace as JSON.
3. Drop the file on the app.

The film strip shows every captured frame with its timestamp. Click a frame to preview it, re-sample the strip at a fixed interval or narrow it to a time range, and download the result.

The [usage guide](docs/usage.md) covers the settings, keyboard shortcuts and export formats.

## Develop

You need [Vite+](https://viteplus.dev) (`vp`):

```bash
curl -fsSL https://vite.plus | bash
```

`vp` provisions everything else. Node.js is pinned in `.node-version` and pnpm in `package.json#devEngines`.

```bash
git clone https://github.com/ChristopherPHolder/trace-convenience.git
cd trace-convenience
vp install   # dependencies and the pre-commit hook
vp run dev   # http://localhost:5173
```

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `vp run dev`       | Start the web app's dev server                   |
| `vp check`         | Format, lint and type-check                      |
| `vp test`          | Run every package's tests                        |
| `vp run -r build`  | Build every package                              |
| `vp run ready`     | Everything CI runs: check, test and build        |
| `vp run web#build` | Production build of the app into `apps/web/dist` |

## Workspace

A pnpm workspace managed by Vite+:

| Package                                                                        | What it is                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`apps/web`](apps/web)                                                         | The Angular app: upload, film strip, preview and export                                          |
| [`packages/trace-core`](packages/trace-core) (`@trace-convenience/trace-core`) | Framework-agnostic trace parsing and frame selection, shared with the planned CLI and MCP server |

## Documentation

- [Usage](docs/usage.md): capturing a trace and working with the film strip
- [Architecture](docs/architecture.md): how the packages fit together and how a trace becomes a film strip
- [Development](docs/development.md): setup, commands, conventions and testing
- [Deployment](docs/deployment.md): CI and GitHub Pages
- [Architecture decision records](docs/adr/README.md): why the project is built the way it is

## License

MIT
