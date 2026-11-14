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

/**
 * A decoded trace whose main thread runs one task per `[startMs, durationMs]`
 * pair, each with a function call that takes the first half of it. The trace
 * starts at the first task.
 */
export function traceWithTasksAt(tasks: readonly (readonly [number, number])[]): unknown {
  const event = (name: string, startMs: number, durationMs: number) => ({
    name,
    ph: "X",
    pid: 1,
    tid: 1,
    ts: 5_000_000 + startMs * 1000,
    dur: durationMs * 1000,
  });

  return {
    traceEvents: [
      { name: "thread_name", ph: "M", pid: 1, tid: 1, args: { name: "CrRendererMain" } },
      ...tasks.flatMap(([startMs, durationMs]) => [
        event("RunTask", startMs, durationMs),
        event("FunctionCall", startMs, durationMs / 2),
      ]),
    ],
  };
}
