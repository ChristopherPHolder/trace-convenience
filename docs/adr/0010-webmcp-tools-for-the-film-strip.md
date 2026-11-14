# 0010. WebMCP tools for the film strip

- Status: Accepted
- Date: 2026-11-14

## Context

An agent that drives the app in the browser has to click through the settings dialog and read the result off the page. [WebMCP](https://webmachinelearning.github.io/webmcp/) lets a page publish typed tools through `document.modelContext`, so an agent can call the app directly.

Several constraints shape what the tools can be:

- WebMCP is a draft. Chrome has it behind `chrome://flags/#enable-webmcp-testing`, and in an origin trial from Chrome 149.
- A tool's input and result are JSON. A tool cannot take a file or return an image.
- [ADR 0001](0001-process-traces-in-the-browser.md) promises that a trace never leaves the user's machine. What a tool returns goes to whatever model the agent uses.
- Angular, at the version this repo pins, ships `provideExperimentalWebMcpTools` and the WebMCP types.

## Decision

Publish three tools: `get_film_strip_state`, `update_film_strip_settings` and `export_film_strip`.

- **No tool loads a trace.** A trace is tens of megabytes and tool input is JSON. The user loads it, or the agent uses the file input.
- **No tool returns image data.** The tools return the file name, the screenshot count, the duration, the settings and the frame times. That is the least an agent needs to choose a time range and confirm what it exported. The export downloads to the user's device, as the button does.
- **The tools use the UI's services.** Frame selection moved to `FilmStripService` and the export to `FilmStripExportService`, so a tool call and a click run the same code and the page shows what the agent did.
- **Only settings the dialog shows can be changed.** The export height and padding have no control in the UI, so the user could not see or undo a change to them.
- **Register through Angular's `provideExperimentalWebMcpTools`,** not by calling `document.modelContext` ourselves. It feature-detects, unregisters with the app, runs `execute` in the injection context, and brings the types, so the app needs no extra dependency.
- **Failures are returned as `{ error }`, not thrown.** Chrome 157 replaces a thrown error with "Tool was executed but the invocation failed", so the agent would not learn what to fix.
- **Results that carry the file name are marked `untrustedContentHint`.** The name comes from the user's file, not from the app.
- **Flag only, no origin trial token.** A token is tied to `christopherpholder.github.io`, which every project page on that account shares, and it expires.

## Consequences

- An agent can read the strip, narrow it and export it in three calls, and the user watches the page follow along.
- The file name and the frame times of a trace can now reach an agent's model. Screenshots, URLs and request data still cannot. This narrows ADR 0001 for users who run an agent on the page; without one, nothing changes.
- Both APIs are experimental. An Angular upgrade or a spec change can rename either, so check the tools in Chrome's WebMCP pane after upgrading Angular.
- Visitors need the Chrome flag until WebMCP ships or the site joins the origin trial. In every other browser the provider does nothing.
- An agent cannot see the frames. One that needs to look at them has to take its own screenshot of the page.
