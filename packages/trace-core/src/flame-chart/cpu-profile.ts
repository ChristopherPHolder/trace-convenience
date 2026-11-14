import { isJsInvocation } from "./event-styles";

/** A trace event with a start and a duration, in microseconds. */
export interface CompleteEvent {
  name: string;
  ts: number;
  dur: number;
  /** `args.data.type` of an `EventDispatch` event, such as `click`. */
  eventType?: string;
}

/** A node of the CPU profile's call tree. */
export interface ProfileNode {
  id: number;
  parent: ProfileNode | null;
  functionName: string;
  url: string;
  scriptId: string;
  lineNumber: number;
}

export interface CpuProfile {
  nodes: ReadonlyMap<number, ProfileNode>;
  /** The node the sampler saw at each timestamp. */
  samples: number[];
  /** Microseconds, ascending. Same length as `samples`. */
  timestamps: number[];
}

/** A JavaScript function call rebuilt from consecutive samples. */
export interface JsCall {
  node: ProfileNode;
  ts: number;
  dur: number;
}

export interface RawProfileNode {
  id?: number;
  parent?: number;
  children?: number[];
  callFrame?: {
    functionName?: string;
    url?: string;
    scriptId?: string | number;
    lineNumber?: number;
  };
}

export interface RawProfileChunk {
  nodes?: RawProfileNode[];
  samples?: number[];
  timeDeltas?: number[];
}

const PROGRAM = "(program)";
const IDLE = "(idle)";
const GARBAGE_COLLECTOR = "(garbage collector)";

/** Frames V8 reports for its own runtime functions. DevTools leaves them out. */
const NATIVE_RUNTIME_URL = "native V8Runtime";

/**
 * Joins the chunks of a CPU profile. `startTime` is the timestamp of the
 * trace's `Profile` event, and each sample's time is the running sum of the
 * time deltas from there.
 */
export function buildCpuProfile(startTime: number, chunks: readonly RawProfileChunk[]): CpuProfile {
  const nodes = new Map<number, ProfileNode>();
  const parentIds = new Map<number, number>();
  const samples: number[] = [];
  const timestamps: number[] = [];
  let time = startTime;

  for (const chunk of chunks) {
    for (const raw of chunk.nodes ?? []) {
      if (typeof raw.id !== "number") continue;
      const frame = raw.callFrame ?? {};
      nodes.set(raw.id, {
        id: raw.id,
        parent: null,
        functionName: frame.functionName ?? "",
        url: frame.url ?? "",
        scriptId: String(frame.scriptId ?? 0),
        lineNumber: frame.lineNumber ?? -1,
      });
      // A trace names each node's parent. A .cpuprofile lists the children.
      if (typeof raw.parent === "number") parentIds.set(raw.id, raw.parent);
      for (const child of raw.children ?? []) parentIds.set(child, raw.id);
    }

    const chunkSamples = chunk.samples ?? [];
    const deltas = chunk.timeDeltas ?? [];
    for (let i = 0; i < chunkSamples.length; i++) {
      time += deltas[i] ?? 0;
      samples.push(chunkSamples[i]);
      timestamps.push(time);
    }
  }

  for (const [id, parentId] of parentIds) {
    const node = nodes.get(id);
    if (node) node.parent = nodes.get(parentId) ?? null;
  }

  const profile = sortByTime({ nodes, samples, timestamps });
  restoreLostSamples(profile);
  return profile;
}

/** The sampler's time deltas can be negative, so samples are not always in order. */
function sortByTime(profile: CpuProfile): CpuProfile {
  const { samples, timestamps } = profile;
  const order = timestamps.map((_, index) => index).sort((a, b) => timestamps[a] - timestamps[b]);
  return {
    nodes: profile.nodes,
    samples: order.map((index) => samples[index]),
    timestamps: order.map((index) => timestamps[index]),
  };
}

/**
 * V8 sometimes fails to read the stack and reports `(program)` for one sample,
 * which would split a call in two. When a single `(program)` sample sits
 * between two stacks with the same bottom frame, it takes the earlier stack.
 */
function restoreLostSamples(profile: CpuProfile): void {
  const { nodes, samples } = profile;
  const isSystem = (id: number): boolean => {
    const node = nodes.get(id);
    return node === undefined || isMetaNode(node);
  };
  const bottomOf = (id: number): ProfileNode | undefined => {
    let node = nodes.get(id);
    while (node?.parent?.parent) node = node.parent;
    return node;
  };

  for (let i = 1; i < samples.length - 1; i++) {
    const previous = samples[i - 1];
    const next = samples[i + 1];
    if (
      nodes.get(samples[i])?.functionName === PROGRAM &&
      !isSystem(previous) &&
      !isSystem(next) &&
      bottomOf(previous) === bottomOf(next)
    ) {
      samples[i] = previous;
    }
  }
}

/** The root and the `(program)`, `(idle)` and `(garbage collector)` nodes under it. */
function isMetaNode(node: ProfileNode): boolean {
  if (node.parent === null) return true;
  if (node.parent.parent !== null) return false;
  return (
    node.functionName === PROGRAM ||
    node.functionName === IDLE ||
    node.functionName === GARBAGE_COLLECTOR
  );
}

function isSameFrame(a: ProfileNode, b: ProfileNode): boolean {
  return (
    a.scriptId === b.scriptId && a.functionName === b.functionName && a.lineNumber === b.lineNumber
  );
}

/**
 * Turns CPU profile samples into JavaScript calls that nest inside the trace
 * events, the way the DevTools Performance panel does.
 *
 * A sample is one stack at one moment. A frame that stays in the stack from
 * one sample to the next is one call; a frame that drops out has returned.
 * Trace events add what samples cannot see: every frame that opened inside an
 * event ends with it, and the frames below an open event cannot return until
 * the event does.
 *
 * `events` must be sorted by start, longest first on a tie.
 */
export function buildJsCalls(events: readonly CompleteEvent[], profile: CpuProfile): JsCall[] {
  const calls: JsCall[] = [];
  /** The JavaScript stack as of the last sample or event. */
  const jsStack: JsCall[] = [];
  /** The trace events in progress, outermost first. */
  const openEvents: CompleteEvent[] = [];
  /** For each open event, how deep the JavaScript stack was when it started. */
  let lockedDepths: number[] = [];
  /** Samples are being read outside a JavaScript event, as if one were open. */
  let assumingJs = false;
  let lastTime = 0;

  const stacks = new Map<number, ProfileNode[]>();
  /** The frames from the outermost call to `node`. */
  const stackOf = (node: ProfileNode): ProfileNode[] => {
    let stack = stacks.get(node.id);
    if (!stack) {
      stack = [];
      for (let frame: ProfileNode | null = node; frame?.parent; frame = frame.parent) {
        if (frame.url !== NATIVE_RUNTIME_URL) stack.push(frame);
      }
      stack.reverse();
      stacks.set(node.id, stack);
    }
    return stack;
  };

  /** Ends every frame above `depth` at `time`. Frames under an open event stay. */
  const truncate = (depth: number, time: number): void => {
    const locked = lockedDepths.at(-1) ?? 0;
    const keep = Math.min(Math.max(depth, locked), jsStack.length);
    for (const call of jsStack) call.dur = Math.max(time - call.ts, 0);
    jsStack.length = keep;
  };

  const applySample = (stack: readonly ProfileNode[], time: number): void => {
    let depth = lockedDepths.at(-1) ?? 0;
    const shared = Math.min(stack.length, jsStack.length);
    while (depth < shared && isSameFrame(stack[depth], jsStack[depth].node)) depth++;
    truncate(depth, time);
    for (; depth < stack.length; depth++) {
      const node = stack[depth];
      if (isMetaNode(node)) continue;
      const call: JsCall = { node, ts: time, dur: 0 };
      jsStack.push(call);
      calls.push(call);
    }
  };

  const startEvent = (event: CompleteEvent): void => {
    // Tasks and microtasks start on an empty JavaScript stack.
    if (event.name === "RunTask" || event.name === "RunMicrotasks") {
      lockedDepths = [];
      truncate(0, event.ts);
      assumingJs = false;
    }
    if (assumingJs) {
      truncate(lockedDepths.pop() ?? 0, event.ts);
      assumingJs = false;
    }
    lockedDepths.push(jsStack.length);
    openEvents.push(event);
  };

  const endEvent = (event: CompleteEvent): void => {
    truncate(lockedDepths.pop() ?? 0, event.ts + event.dur);
  };

  const endEventsBefore = (time: number): void => {
    for (let top = openEvents.at(-1); top && time >= top.ts + top.dur; top = openEvents.at(-1)) {
      endEvent(top);
      openEvents.pop();
    }
  };

  let lastStack: readonly ProfileNode[] = [];
  const onSample = (index: number): void => {
    const node = profile.nodes.get(profile.samples[index]);
    if (!node) return;
    const time = profile.timestamps[index];

    // The collector runs on top of whatever was executing, so the stack is unchanged.
    const isCollecting = node.functionName === GARBAGE_COLLECTOR && node.parent?.parent === null;
    const stack = isCollecting ? lastStack : stackOf(node);
    lastStack = stack;

    const parent = openEvents.at(-1);
    if ((parent && isJsInvocation(parent.name)) || assumingJs) {
      applySample(stack, time);
    } else if (jsStack.length === 0) {
      // The trace can start in the middle of a JavaScript event, so its
      // samples have no event around them. Read them as if one were open.
      assumingJs = true;
      applySample(stack, time);
      lockedDepths.push(0);
    }
  };

  let eventIndex = 0;
  let sampleIndex = 0;
  while (eventIndex < events.length || sampleIndex < profile.samples.length) {
    const hasEvent = eventIndex < events.length;
    const hasSample = sampleIndex < profile.samples.length;
    const event = events[eventIndex];
    const sampleTime = profile.timestamps[sampleIndex];
    // On a tie, an event with a duration starts first and contains the sample.
    const takeSample =
      hasSample &&
      (!hasEvent || sampleTime < event.ts || (sampleTime === event.ts && event.dur === 0));

    lastTime = takeSample ? sampleTime : event.ts;
    endEventsBefore(lastTime);
    if (takeSample) {
      onSample(sampleIndex++);
    } else {
      startEvent(event);
      eventIndex++;
    }
  }

  for (let event = openEvents.pop(); event; event = openEvents.pop()) {
    lastTime = Math.max(lastTime, event.ts + event.dur);
    endEvent(event);
  }
  for (const call of jsStack) call.dur = Math.max(lastTime - call.ts, 0);

  return calls.filter((call) => call.dur > 0);
}
