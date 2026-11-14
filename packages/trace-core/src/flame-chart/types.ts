/** The groups the DevTools Performance panel colours main-thread activity by. */
export type FlameChartCategory =
  | "loading"
  | "scripting"
  | "rendering"
  | "painting"
  | "messaging"
  | "system"
  | "idle"
  | "async";

/** One bar of the flame chart: a trace event or a JavaScript frame. */
export interface FlameChartEntry {
  /** The name DevTools shows, such as `Function call`, `Event: click` or a function name. */
  name: string;
  /** `event` is a trace event. `js` is a JavaScript frame taken from the CPU profile. */
  kind: "event" | "js";
  category: FlameChartCategory;
  /** Fill colour, as `#rrggbb`. */
  color: string;
  /** Trace timestamp in microseconds. */
  start: number;
  /** In microseconds. */
  duration: number;
  /** `duration` minus the time spent in direct children, in microseconds. */
  selfTime: number;
  /** Nesting level. A top-level task is at 0. */
  depth: number;
  /** Script URL of a JavaScript frame. Empty when the frame has none. */
  url: string;
}

export interface FlameChartThread {
  processId: number;
  threadId: number;
  /** The thread's name in the trace, such as `CrRendererMain`. Empty when the trace has none. */
  name: string;
}

/** The main thread's activity, ready to lay out. */
export interface FlameChart {
  /** `null` when the trace has no thread with activity. */
  thread: FlameChartThread | null;
  /** In call-tree order: sorted by start, and every parent comes before its children. */
  entries: FlameChartEntry[];
  /** Start of the trace, in microseconds. */
  startTime: number;
  /** End of the trace, in microseconds. */
  endTime: number;
  /** The deepest nesting level of any entry. -1 when there are none. */
  maxDepth: number;
}
