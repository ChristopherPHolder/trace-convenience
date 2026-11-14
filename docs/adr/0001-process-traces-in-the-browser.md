# 0001. Process traces entirely in the browser

- Status: Accepted
- Date: 2025-11-11

## Context

A Chrome DevTools trace can hold sensitive material: URLs, request data and screenshots of whatever was on screen. Traces are also large, often tens of megabytes.

The app only needs to read a trace and show its screenshots. Nothing in that requires a server.

## Decision

The app is a static site with no backend. A trace is read with the File API, parsed with `JSON.parse` and kept in memory in a signal store (`TraceService`).

- Only `.json` files are accepted. The check is on the file extension, then on whether the content parses.
- There is no size limit.
- Nothing is persisted. No `localStorage`, no IndexedDB, no upload.
- The app holds one trace at a time. Loading another replaces it.

## Consequences

- A trace never leaves the user's machine, so the app is safe to use with traces from private or internal pages.
- Hosting is free and simple: static files on GitHub Pages ([ADR 0008](0008-single-ci-workflow-gates-pages-deploy.md)).
- A reload clears the loaded trace. Users load it again.
- Parsing and rendering run on the main thread, so a very large trace can block the UI while it loads.
- Features that need a server, such as sharing a film strip by link, are out of scope unless this decision is revisited.
