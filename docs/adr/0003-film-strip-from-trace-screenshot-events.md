# 0003. Build the film strip from the trace's screenshot events

- Status: Accepted
- Date: 2025-11-11

## Context

Chrome writes screenshots into a trace as ordinary trace events with a base64 image in their arguments. Depending on how the trace was recorded, the frames appear under different event names and argument keys. The images are JPEG or PNG, sometimes as a data URI and sometimes as bare base64.

## Decision

`parseTrace` scans `traceEvents` once and collects screenshots from three event types:

| Event                                                                  | Image                         |
| ---------------------------------------------------------------------- | ----------------------------- |
| `Screenshot` in the `disabled-by-default-devtools.screenshot` category | `args.snapshot`, bare base64  |
| `ScreencastFrame`                                                      | `args.dataUri` or `args.data` |
| `CaptureFrame`                                                         | `args.data`                   |

Each screenshot is stored as bare base64 with its format and the event's timestamp in microseconds. The format comes from the data-URI prefix or the base64 magic bytes, and defaults to JPEG. Screenshots are sorted by timestamp.

The parser declares the few event fields it reads itself and does not depend on a trace schema package.

A trace with no screenshots is valid. It produces an empty result, and the UI explains that the Screenshots option was off. Only input that is not a trace object throws.

## Consequences

- The app works with traces saved from the Performance panel without any conversion step.
- All other trace data is ignored. Showing metrics or the timeline next to the frames would mean extending the parser.
- If Chrome changes how it records screenshots, `parseTrace` is the one place to update. See [Development](../development.md#support-another-screenshot-event).
- Timestamps stay in microseconds, as in the trace. Formatting to `ms` or `s` happens at display time.
