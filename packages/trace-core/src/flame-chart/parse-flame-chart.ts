import { categoryColor, scriptColor } from "./color";
import {
  buildCpuProfile,
  buildJsCalls,
  type CompleteEvent,
  type RawProfileChunk,
} from "./cpu-profile";
import { eventStyleOf } from "./event-styles";
import type { FlameChart, FlameChartEntry, FlameChartThread } from "./types";

interface RawFrame {
  processId?: number;
  isOutermostMainFrame?: boolean;
  parent?: string;
}

interface RawEvent {
  name?: string;
  ph?: string;
  pid?: number;
  tid?: number;
  ts?: number;
  dur?: number;
  id?: string | number;
  args?: {
    /** Of a `thread_name` metadata event. */
    name?: string;
    data?: RawFrame & {
      /** Of an `EventDispatch` event. */
      type?: string;
      /** Of a `TracingStartedInBrowser` event. */
      frames?: RawFrame[];
      /** Of a `ProfileChunk` event. */
      cpuProfile?: RawProfileChunk;
      timeDeltas?: number[];
    };
  };
}

interface ThreadSummary extends FlameChartThread {
  /** How many events with a duration the thread has. */
  eventCount: number;
}

/** The renderer's main thread, where the page's JavaScript, style, layout and paint run. */
const RENDERER_MAIN_THREAD = "CrRendererMain";

/**
 * Builds the flame chart of the page's main thread from a Chrome DevTools trace
 * (already JSON-decoded): the trace events DevTools draws, with the JavaScript
 * frames of the CPU profile nested inside them.
 *
 * Throws on input that is not a trace. A trace without main-thread activity
 * gives a chart with no entries.
 */
export function parseFlameChart(traceContent: unknown): FlameChart {
  const events = traceEventsOf(traceContent);
  const { threads, mainFramePids, startTime, endTime } = scan(events);
  const thread = pickMainThread(threads, mainFramePids);
  if (!thread) {
    return { thread: null, entries: [], startTime, endTime, maxDepth: -1 };
  }

  const { completeEvents, profile } = collectThread(events, thread);
  const jsCalls = profile ? buildJsCalls(completeEvents, profile) : [];

  const entries: FlameChartEntry[] = [];
  for (const event of completeEvents) {
    const style = eventStyleOf(event.name);
    if (!style) continue;
    const [label, category] = style;
    entries.push({
      name: event.name === "EventDispatch" && event.eventType ? `Event: ${event.eventType}` : label,
      kind: "event",
      category,
      color: categoryColor(category),
      start: event.ts,
      duration: event.dur,
      selfTime: event.dur,
      depth: 0,
      url: "",
    });
  }
  for (const call of jsCalls) {
    const { functionName, scriptId, url } = call.node;
    entries.push({
      name: functionName || "(anonymous)",
      kind: "js",
      category: "scripting",
      // A frame V8 cannot place in a script gets the plain scripting colour.
      color: scriptId === "0" ? categoryColor("scripting") : scriptColor(url),
      start: call.ts,
      duration: call.dur,
      selfTime: call.dur,
      depth: 0,
      url,
    });
  }

  const nested = nest(entries);
  return {
    thread: { processId: thread.processId, threadId: thread.threadId, name: thread.name },
    entries: nested.entries,
    startTime,
    endTime,
    maxDepth: nested.maxDepth,
  };
}

/** Length of the chart's trace, in ms. */
export function flameChartDurationMs(chart: FlameChart): number {
  return (chart.endTime - chart.startTime) / 1000;
}

function traceEventsOf(traceContent: unknown): RawEvent[] {
  if (!traceContent || typeof traceContent !== "object") {
    throw new Error("Invalid trace format");
  }
  // A trace is either `{ traceEvents: [...] }` or the bare array of events.
  const events = Array.isArray(traceContent)
    ? traceContent
    : ((traceContent as { traceEvents?: unknown }).traceEvents ?? []);
  if (!Array.isArray(events)) {
    throw new Error("Trace events must be an array");
  }
  return (events as unknown[]).filter(
    (event): event is RawEvent => typeof event === "object" && event !== null,
  );
}

const threadKey = (pid: number | undefined, tid: number | undefined): string => `${pid}:${tid}`;

/** One pass over every event: the threads, the page's processes and the trace bounds. */
function scan(events: readonly RawEvent[]): {
  threads: ThreadSummary[];
  mainFramePids: Set<number>;
  startTime: number;
  endTime: number;
} {
  const threads = new Map<string, ThreadSummary>();
  const mainFramePids = new Set<number>();
  let tracingStart: number | undefined;
  let firstTime = Infinity;
  let lastTime = -Infinity;

  const threadOf = (event: RawEvent): ThreadSummary => {
    const key = threadKey(event.pid, event.tid);
    let thread = threads.get(key);
    if (!thread) {
      thread = { processId: event.pid ?? 0, threadId: event.tid ?? 0, name: "", eventCount: 0 };
      threads.set(key, thread);
    }
    return thread;
  };
  const notePageProcess = (frame: RawFrame | undefined): void => {
    const isOutermost = frame?.isOutermostMainFrame ?? !frame?.parent;
    if (typeof frame?.processId === "number" && isOutermost) mainFramePids.add(frame.processId);
  };

  for (const event of events) {
    if (event.ph === "M") {
      if (event.name === "thread_name") threadOf(event).name = event.args?.name ?? "";
      continue;
    }
    if (typeof event.ts !== "number" || event.ts <= 0) continue;

    firstTime = Math.min(firstTime, event.ts);
    lastTime = Math.max(lastTime, event.ts + (event.dur ?? 0));
    if (event.ph === "X" || event.ph === "B") threadOf(event).eventCount++;

    if (event.name === "TracingStartedInBrowser") {
      tracingStart ??= event.ts;
      for (const frame of event.args?.data?.frames ?? []) notePageProcess(frame);
    } else if (event.name === "FrameCommittedInBrowser") {
      notePageProcess(event.args?.data);
    }
  }

  const startTime = tracingStart ?? (Number.isFinite(firstTime) ? firstTime : 0);
  return {
    threads: [...threads.values()],
    mainFramePids,
    startTime,
    endTime: Math.max(startTime, lastTime),
  };
}

/**
 * The busiest main thread among the page's own renderer processes. A trace
 * that names no renderer main thread, such as one not recorded by DevTools,
 * falls back to its busiest thread.
 */
function pickMainThread(
  threads: readonly ThreadSummary[],
  mainFramePids: ReadonlySet<number>,
): ThreadSummary | undefined {
  const active = threads.filter((thread) => thread.eventCount > 0);
  const rendererMains = active.filter((thread) => thread.name === RENDERER_MAIN_THREAD);
  const ofThePage = rendererMains.filter((thread) => mainFramePids.has(thread.processId));

  const candidates = [ofThePage, rendererMains, active].find((group) => group.length > 0) ?? [];
  return candidates.reduce<ThreadSummary | undefined>(
    (busiest, thread) => (busiest && busiest.eventCount >= thread.eventCount ? busiest : thread),
    undefined,
  );
}

/** The thread's events with a duration, sorted, and its CPU profile if the trace has one. */
function collectThread(
  events: readonly RawEvent[],
  thread: FlameChartThread,
): { completeEvents: CompleteEvent[]; profile: ReturnType<typeof buildCpuProfile> | null } {
  const completeEvents: CompleteEvent[] = [];
  const beginStack: CompleteEvent[] = [];
  let profileId: string | number | undefined;
  let profileStart = 0;
  // The sampler writes its chunks from another thread, under the profile's id.
  const chunksById = new Map<string | number, { ts: number; chunk: RawProfileChunk }[]>();

  for (const event of events) {
    if (event.pid !== thread.processId) continue;
    const ts = event.ts ?? 0;

    if (event.name === "ProfileChunk" && event.id !== undefined) {
      const data = event.args?.data;
      const chunks = chunksById.get(event.id) ?? [];
      chunks.push({
        ts,
        chunk: {
          ...data?.cpuProfile,
          timeDeltas: data?.timeDeltas ?? data?.cpuProfile?.timeDeltas,
        },
      });
      chunksById.set(event.id, chunks);
      continue;
    }
    if (event.tid !== thread.threadId) continue;

    if (event.name === "Profile") {
      if (profileId === undefined && event.id !== undefined) {
        profileId = event.id;
        profileStart = ts;
      }
    } else if (event.ph === "X") {
      completeEvents.push(toComplete(event, ts, event.dur ?? 0));
    } else if (event.ph === "B") {
      const begun = toComplete(event, ts, 0);
      beginStack.push(begun);
      completeEvents.push(begun);
    } else if (event.ph === "E") {
      // An end without a begin is expected: the trace can start mid-event.
      const begun = beginStack.pop();
      if (begun) begun.dur = Math.max(ts - begun.ts, 0);
    }
  }

  // Longest first on a tie, so a parent comes before the child it starts with.
  completeEvents.sort((a, b) => a.ts - b.ts || b.dur - a.dur);

  const chunks = profileId === undefined ? undefined : chunksById.get(profileId);
  const profile = chunks
    ? buildCpuProfile(
        profileStart,
        chunks.sort((a, b) => a.ts - b.ts).map(({ chunk }) => chunk),
      )
    : null;
  return { completeEvents, profile };
}

function toComplete(event: RawEvent, ts: number, dur: number): CompleteEvent {
  return { name: event.name ?? "", ts, dur, eventType: event.args?.data?.type };
}

/**
 * Sorts the entries into call-tree order and gives each its depth and self
 * time. An entry that starts inside its parent but ends after it cannot be
 * drawn as a child, so it is dropped, as DevTools does.
 */
function nest(entries: FlameChartEntry[]): { entries: FlameChartEntry[]; maxDepth: number } {
  // Longest first on a tie. `Array.prototype.sort` is stable, so an event
  // stays ahead of a JavaScript frame with the same start and duration.
  entries.sort((a, b) => a.start - b.start || b.duration - a.duration);

  const nested: FlameChartEntry[] = [];
  const parents: FlameChartEntry[] = [];
  let maxDepth = -1;

  for (const entry of entries) {
    const end = entry.start + entry.duration;
    let parent = parents.at(-1);
    while (parent && entry.start >= parent.start + parent.duration) {
      parents.pop();
      parent = parents.at(-1);
    }
    if (parent) {
      if (end > parent.start + parent.duration) continue;
      parent.selfTime -= entry.duration;
    }

    entry.depth = parents.length;
    maxDepth = Math.max(maxDepth, entry.depth);
    parents.push(entry);
    nested.push(entry);
  }

  return { entries: nested, maxDepth };
}
