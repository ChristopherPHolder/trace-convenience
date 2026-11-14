# Usage

## Capture a trace with screenshots

1. Open Chrome DevTools (`F12`, or `Cmd+Option+I` on macOS) and go to the **Performance** panel.
2. Open the capture settings (the gear icon) and enable **Screenshots**.
3. Click **Record**, do what you want to capture, then click **Stop**.
4. Save the trace: right-click the timeline and choose **Save profile...**

Without the Screenshots option the trace has no frames, and the app shows "No screenshots found in this trace".

## Load the trace

Drop the JSON file on the upload zone, or click **Browse files**.

- Only `.json` files are accepted.
- The app holds one trace at a time. Loading another one replaces it.
- The trace is read and parsed in the browser. Nothing is sent to a server, and nothing is stored: a reload clears it.

The tabs under the file choose what to make from the trace: a **Film strip** or a **Flame chart**.

## Film strip

The strip shows the captured frames in order. Each frame has its time relative to the start of the strip.

**Settings** opens the options that decide which frames appear:

| Setting         | Default    | Effect                                                                                                                               |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Fixed intervals | On, 100 ms | Re-samples the strip onto an even timeline, one frame per interval (10 ms to 2 s), each showing the latest screenshot at that moment |
| Time range      | Off        | Limits the strip to a start and end time in milliseconds, plus one frame of context on each side                                     |
| Timestamps      | On         | Shows the time under each frame, in the strip and in both exports                                                                    |

With fixed intervals off, the strip shows every screenshot at the time Chrome captured it, with the time since the previous frame.

## Preview

Click a frame to open it at full size.

| Key       | Action                 |
| --------- | ---------------------- |
| `←` / `→` | Previous or next frame |
| `F`       | Toggle fullscreen      |
| `Esc`     | Close the preview      |

## Download

Pick a format next to **Download**:

- **PNG**: one static image with the visible frames side by side.
- **GIF**: an animation of the visible frames, 500 ms per frame.

Both exports use the frames currently in the strip, so the interval and time range settings apply to them.

## Flame chart

The **Flame chart** tab shows the page's main thread the way the Performance panel draws it: tasks on the top row and what ran inside them below. Trace events have the colour of their category, and JavaScript functions have one colour per script file.

| Colour | Category                                         |
| ------ | ------------------------------------------------ |
| Grey   | Task                                             |
| Yellow | Scripting: function calls, timers, events, GC    |
| Purple | Rendering: style, layout, pre-paint              |
| Green  | Painting: paint, commit, image decode            |
| Blue   | Loading: HTML and stylesheet parsing             |
| Pastel | JavaScript functions, one colour per script file |

A task longer than 50 ms is hatched in red from the 50 ms mark on. Hover a bar to read its full name, its duration, its self time and its script.

### Choose the part to keep

The overview above the chart shows the whole trace. Everything outside the selected range is left out of the chart and of the download.

| To                              | Do this                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| Select a range                  | Drag across the overview                                               |
| Move an edge                    | Drag its handle, or focus it and press `←` `→` (`Shift` for big steps) |
| Move the range without resizing | Drag the tab on its top edge                                           |
| Set exact times                 | Type them in **Start (ms)** and **End (ms)**                           |
| Cut to one task or function     | Double-click its bar in the chart                                      |
| Include whole tasks only        | **Snap to tasks** widens the range to the tasks it cuts through        |
| See everything again            | **Whole trace**                                                        |

The start and end fields count from the start of the trace. The axis of the chart counts from the start of the range, so it reads as "how long", not "when".

**Durations on bars** writes each entry's duration after its name where there is room. Turn it off for a chart that shows names only.

### Download

- **Download SVG**: a vector image that stays sharp at any size and can be edited. It uses no web fonts or scripts, so it works in slides, documents and image editors.
- **PNG**: the same image at twice the size on screen.

Both are the chart as shown: the same range, 1200 px wide and as tall as the deepest call stack in it.

## Troubleshooting

| Message                                         | Cause                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| "Only JSON files are accepted"                  | The file name does not end in `.json`                                        |
| "Invalid JSON format"                           | The file is not valid JSON, for example a truncated download                 |
| "No screenshots found in this trace"            | The trace was recorded without the Screenshots option                        |
| "No main thread activity found in this trace"   | The file is not a Performance panel trace, or it has no renderer main thread |
| "There is nothing in this time range to export" | The selected range has no activity. Widen it or choose **Whole trace**.      |

Function names in the flame chart are the ones in the trace. A minified bundle shows minified names; the app does not apply source maps.
