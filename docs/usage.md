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

## Troubleshooting

| Message                              | Cause                                                        |
| ------------------------------------ | ------------------------------------------------------------ |
| "Only JSON files are accepted"       | The file name does not end in `.json`                        |
| "Invalid JSON format"                | The file is not valid JSON, for example a truncated download |
| "No screenshots found in this trace" | The trace was recorded without the Screenshots option        |
