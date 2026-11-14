# 0011. Flame chart laid out in `trace-core` and drawn as SVG

- Status: Accepted
- Date: 2026-11-14

## Context

The film strip was the first tool. The second cuts a piece out of a trace's flame chart and exports it as an image, so that a slide or a report can show a few tasks without the rest of the recording around them.

A trace does not contain a flame chart. It contains trace events for every thread of every process, and a CPU profile as a list of sampled stacks. The Performance panel of Chrome DevTools turns those into the chart people know, and the export has to look like that chart or it reads as a different measurement.

Several constraints shape the design:

- [ADR 0009](0009-framework-agnostic-trace-core-package.md) keeps trace logic in `trace-core`, without a DOM, so the planned CLI and MCP server can reuse it. A chart drawn on a browser canvas would repeat the film strip's limit: a Node front end would need its own renderer.
- The export has to match what the page shows.
- The chart has to be cut to a time range, and the range is easier to choose by pointing at the trace than by typing numbers.
- The app has no router. It was removed as unused.

## Decision

**Follow DevTools for what is drawn.** `parseFlameChart` reads the main thread of the page's renderer process and reproduces the panel's rules:

- Only the events DevTools draws are kept, with its labels and categories. The table is copied from `front_end/models/trace/Styles.ts` in devtools-frontend.
- JavaScript frames come from the CPU profile. Consecutive samples of a frame become one call, and the calls are fitted inside the trace events the way DevTools' `SamplesIntegrator` does it: a frame that opened inside an event ends with it, and the frames under an open event cannot return before it does.
- Colours are the light theme's `--app-color-*` tokens. A JavaScript frame is coloured by a hash of its script URL, with the same hash and the same hue, saturation and lightness ranges, so one file's frames share a colour.
- A task longer than 50 ms is hatched in red past the 50 ms mark.

**Main thread only.** That is where a page's JavaScript, style, layout and paint run, and it is what people mean by "the flame chart". The thread is the busiest `CrRendererMain` among the processes that host the page's outermost frame.

**Lay out in `trace-core`, as data.** `layoutFlameChart` turns the chart and a time range into a `FlameChartLayout`: the position, colour and text of every bar, the axis ticks and the long-task marks, in px. It does everything that needs a decision, including cutting a label to its bar. `trace-core` cannot ask a browser how wide a string is, so it measures with a table of Helvetica's character widths and the chart is set in fonts that share those metrics.

**SVG is the one output format.** `renderFlameChartSvg` writes the layout as a standalone SVG document. The app downloads that string as the SVG export and draws the same string on a canvas for the PNG export, so the two cannot differ. The page shows the layout through an Angular template instead of injecting the string, which keeps Angular's sanitiser in place for names that come from the trace. Both read the same layout and the same `FLAME_CHART_STYLE`, and neither makes a layout decision.

**A fixed width of 1200 px.** The chart on the page scales to its container, but the layout is always computed at 1200 px. An export therefore does not depend on the size of the window it was made in.

**The chart is light in both themes.** It is a reproduction of the DevTools chart, like the screenshots of the film strip, and an export has to look the same whichever theme the app was in.

**The time axis starts at the cut.** A cut-out is read for how long things took, not for when they happened in the recording. The range fields show times from the start of the trace.

**Tools are tabs, not routes.** `TraceToolsComponent` holds the selected tool in a signal and renders only that tool. Adding a router for two views of the same loaded file would bring back a dependency that was just removed, and a trace cannot be restored from a URL anyway because it is never stored ([ADR 0001](0001-process-traces-in-the-browser.md)).

## Consequences

- A CLI or an MCP server can produce the same SVG from a trace file with three calls and no browser.
- The chart can drift from DevTools. The event table, the colours and the sample rules are copies, and Chrome changes them. A trace that looks different in the panel is the signal to compare against devtools-frontend again.
- Two things draw a layout: the template and `renderFlameChartSvg`. A change to how the chart looks has to be made in both. `FLAME_CHART_STYLE` holds what they share.
- Label widths are estimates. In a font with other metrics than Helvetica a label can end short of its bar or run slightly past it. The font stack names Helvetica, Arial and Liberation Sans, which covers macOS, Windows and most Linux systems.
- Worker threads, other processes, network requests and the other tracks of the Performance panel are not shown. Each would be a new track in the parser and the layout.
- Source maps are not applied, so a minified bundle shows minified function names, as it does in DevTools without source maps.
- A deep stack makes a tall chart. The page scrolls it inside a frame; the export is the full height.
- The tab is not in the URL, so a link cannot open a tool. If that is ever needed, it is a query parameter, not a router.
