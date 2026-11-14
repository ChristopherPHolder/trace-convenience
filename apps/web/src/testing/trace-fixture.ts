/** A decoded trace with one `Screenshot` event at each of the given times (ms). */
export function traceWithScreenshotsAt(timesMs: readonly number[]): unknown {
  return {
    traceEvents: timesMs.map((ms, index) => ({
      name: "Screenshot",
      cat: "disabled-by-default-devtools.screenshot",
      // Traces start at an arbitrary timestamp, in microseconds.
      ts: 5_000_000 + ms * 1000,
      args: { snapshot: `frame${index}` },
    })),
  };
}

export function traceFile(name = "trace.json"): File {
  return new File(["{}"], name, { type: "application/json" });
}
