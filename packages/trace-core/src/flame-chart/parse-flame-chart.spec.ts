import { describe, expect, it } from "vite-plus/test";
import { flameChartDurationMs, parseFlameChart } from "./parse-flame-chart";
import type { FlameChartEntry } from "./types";

const PID = 100;
const MAIN = 1;
/** Traces start at an arbitrary timestamp, in microseconds. */
const T0 = 5_000_000;

type Args = Record<string, unknown>;

const threadName = (name: string, pid = PID, tid = MAIN) => ({
  ph: "M",
  name: "thread_name",
  pid,
  tid,
  args: { name },
});

/** A complete event on the main thread, placed in ms from the start of the trace. */
const complete = (name: string, startMs: number, durMs: number, args: Args = {}) => ({
  ph: "X",
  name,
  pid: PID,
  tid: MAIN,
  ts: T0 + startMs * 1000,
  dur: durMs * 1000,
  args,
});

const traceOf = (...events: object[]) => ({
  traceEvents: [threadName("CrRendererMain"), ...events],
});

/** `name@startMs+durationMs` for each entry, indented by depth, so nesting reads at a glance. */
const outline = (entries: readonly FlameChartEntry[]) =>
  entries.map(
    (entry) =>
      `${"  ".repeat(entry.depth)}${entry.name}@${(entry.start - T0) / 1000}+${entry.duration / 1000}`,
  );

describe("parseFlameChart", () => {
  it.each([null, undefined, "trace", 42])("rejects %s as not a trace", (input) => {
    expect(() => parseFlameChart(input)).toThrow("Invalid trace format");
  });

  it("rejects trace events that are not an array", () => {
    expect(() => parseFlameChart({ traceEvents: {} })).toThrow("Trace events must be an array");
  });

  it("gives an empty chart for a trace without activity", () => {
    expect(parseFlameChart({ traceEvents: [] })).toEqual({
      thread: null,
      entries: [],
      startTime: 0,
      endTime: 0,
      maxDepth: -1,
    });
  });

  it("accepts a bare array of events", () => {
    const chart = parseFlameChart([threadName("CrRendererMain"), complete("RunTask", 0, 10)]);

    expect(outline(chart.entries)).toEqual(["Task@0+10"]);
  });

  describe("events", () => {
    it("nests events by time and names them as DevTools does", () => {
      const chart = parseFlameChart(
        traceOf(
          complete("RunTask", 0, 30),
          complete("EventDispatch", 2, 20, { data: { type: "click" } }),
          complete("FunctionCall", 4, 10),
          complete("Layout", 15, 5),
          complete("RunTask", 40, 8),
          complete("UpdateLayoutTree", 41, 2),
        ),
      );

      expect(outline(chart.entries)).toEqual([
        "Task@0+30",
        "  Event: click@2+20",
        "    Function call@4+10",
        "    Layout@15+5",
        "Task@40+8",
        "  Recalculate style@41+2",
      ]);
      expect(chart.maxDepth).toBe(2);
    });

    it("gives each entry the time its children do not account for", () => {
      const chart = parseFlameChart(
        traceOf(
          complete("RunTask", 0, 30),
          complete("FunctionCall", 4, 10),
          complete("Layout", 15, 5),
        ),
      );

      expect(chart.entries.map((entry) => entry.selfTime / 1000)).toEqual([15, 10, 5]);
    });

    it("colours each entry by its category", () => {
      const chart = parseFlameChart(
        traceOf(
          complete("RunTask", 0, 50),
          complete("FunctionCall", 1, 5),
          complete("Layout", 10, 5),
          complete("Paint", 20, 5),
          complete("ParseHTML", 30, 5),
        ),
      );

      expect(chart.entries.map((entry) => [entry.category, entry.color])).toEqual([
        ["system", "#c7c7c7"],
        ["scripting", "#facc15"],
        ["rendering", "#d190ff"],
        ["painting", "#37be5f"],
        ["loading", "#7cacf8"],
      ]);
    });

    it("leaves out events DevTools does not draw and keeps what is inside them", () => {
      const chart = parseFlameChart(
        traceOf(
          complete("RunTask", 0, 30),
          complete("ThreadControllerImpl::RunTask", 1, 20),
          complete("Layout", 2, 5),
        ),
      );

      expect(outline(chart.entries)).toEqual(["Task@0+30", "  Layout@2+5"]);
    });

    it("keeps the instant events DevTools draws, as entries without a duration", () => {
      const instant = (name: string, atMs: number, ph = "I") => ({
        ph,
        name,
        pid: PID,
        tid: MAIN,
        ts: T0 + atMs * 1000,
        s: "t",
      });

      const chart = parseFlameChart(
        traceOf(
          complete("RunTask", 0, 30),
          complete("FunctionCall", 2, 20),
          instant("TimerInstall", 5),
          instant("UpdateCounters", 6),
          complete("Layout", 10, 5),
          instant("RequestAnimationFrame", 24, "i"),
          complete("RunTask", 40, 5),
        ),
      );

      expect(outline(chart.entries)).toEqual([
        "Task@0+30",
        "  Function call@2+20",
        "    Install timer@5+0",
        "    Layout@10+5",
        "  Request animation frame@24+0",
        "Task@40+5",
      ]);
      expect(chart.entries.map((entry) => entry.selfTime / 1000)).toEqual([10, 15, 0, 5, 0, 5]);
    });

    it("pairs begin and end events", () => {
      const begin = { ph: "B", name: "RunTask", pid: PID, tid: MAIN, ts: T0 };
      const end = { ph: "E", name: "RunTask", pid: PID, tid: MAIN, ts: T0 + 12_000 };

      const chart = parseFlameChart(traceOf(begin, complete("Layout", 2, 5), end));

      expect(outline(chart.entries)).toEqual(["Task@0+12", "  Layout@2+5"]);
    });

    it("drops an event that starts inside its parent and ends after it", () => {
      const chart = parseFlameChart(
        traceOf(complete("RunTask", 0, 10), complete("Layout", 8, 5), complete("RunTask", 20, 5)),
      );

      expect(outline(chart.entries)).toEqual(["Task@0+10", "Task@20+5"]);
    });
  });

  describe("the main thread", () => {
    it("is the busiest renderer main thread of the page's processes", () => {
      const other = (pid: number, tid: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({
          ph: "X",
          name: "RunTask",
          pid,
          tid,
          ts: T0 + i * 1000,
          dur: 500,
        }));

      const chart = parseFlameChart({
        traceEvents: [
          {
            ph: "I",
            name: "TracingStartedInBrowser",
            pid: 1,
            tid: 1,
            ts: T0,
            args: { data: { frames: [{ processId: PID, isOutermostMainFrame: true }] } },
          },
          threadName("CrBrowserMain", 1, 1),
          threadName("CrRendererMain"),
          threadName("Compositor", PID, 2),
          // An embedded frame in its own process, busier than the page itself.
          threadName("CrRendererMain", 200, 1),
          ...other(1, 1, 9),
          ...other(PID, 2, 7),
          ...other(200, 1, 5),
          complete("RunTask", 1, 2),
          complete("RunTask", 5, 2),
        ],
      });

      expect(chart.thread).toEqual({ processId: PID, threadId: MAIN, name: "CrRendererMain" });
      expect(chart.entries).toHaveLength(2);
    });

    it("falls back to the busiest thread when none is a renderer main thread", () => {
      const chart = parseFlameChart({
        traceEvents: [
          { ph: "X", name: "RunTask", pid: 7, tid: 8, ts: T0, dur: 1000 },
          { ph: "X", name: "RunTask", pid: 7, tid: 9, ts: T0, dur: 1000 },
          { ph: "X", name: "RunTask", pid: 7, tid: 9, ts: T0 + 2000, dur: 1000 },
        ],
      });

      expect(chart.thread).toEqual({ processId: 7, threadId: 9, name: "" });
    });
  });

  describe("the time span", () => {
    it("starts where tracing started and ends with the last event of any thread", () => {
      const chart = parseFlameChart(
        traceOf(
          { ph: "I", name: "TracingStartedInBrowser", pid: 1, tid: 1, ts: T0 - 4000, args: {} },
          { ph: "X", name: "RunTask", pid: 1, tid: 1, ts: T0 - 9000, dur: 100 },
          complete("RunTask", 0, 10),
          { ph: "X", name: "RunTask", pid: 1, tid: 1, ts: T0 + 20_000, dur: 6000 },
        ),
      );

      expect(chart.startTime).toBe(T0 - 4000);
      expect(chart.endTime).toBe(T0 + 26_000);
      expect(flameChartDurationMs(chart)).toBe(30);
    });

    it("starts at the first event when the trace does not say where tracing started", () => {
      const chart = parseFlameChart(traceOf(complete("RunTask", 3, 10)));

      expect(chart.startTime).toBe(T0 + 3000);
    });
  });

  describe("JavaScript frames", () => {
    const SCRIPT = "https://example.com/app.js";
    const frame = (id: number, parent: number | undefined, functionName: string, url = SCRIPT) => ({
      id,
      parent,
      callFrame: { functionName, url, scriptId: url ? "7" : "0", lineNumber: id },
    });
    const NODES = [
      frame(1, undefined, "(root)", ""),
      frame(2, 1, "(program)", ""),
      frame(3, 1, "main"),
      frame(4, 3, "render"),
      frame(5, 4, ""),
      frame(6, 3, "flush"),
    ];
    const profile = { ph: "P", name: "Profile", id: "0x1", pid: PID, tid: MAIN, ts: T0, args: {} };
    /** Samples at the given times (ms). The sampler reports them from its own thread. */
    const samples = (...at: [timeMs: number, node: number][]) => {
      let previous = 0;
      return {
        ph: "P",
        name: "ProfileChunk",
        id: "0x1",
        pid: PID,
        tid: 99,
        ts: T0 + 1,
        args: {
          data: {
            cpuProfile: { nodes: NODES, samples: at.map(([, node]) => node) },
            timeDeltas: at.map(([timeMs]) => {
              const delta = timeMs * 1000 - previous;
              previous = timeMs * 1000;
              return delta;
            }),
          },
        },
      };
    };

    it("turns consecutive samples of a frame into one call under the event that ran it", () => {
      const chart = parseFlameChart(
        traceOf(
          profile,
          complete("RunTask", 0, 20),
          complete("FunctionCall", 1, 18),
          samples([2, 4], [4, 5], [6, 5], [8, 6], [10, 2]),
        ),
      );

      expect(outline(chart.entries)).toEqual([
        "Task@0+20",
        "  Function call@1+18",
        "    main@2+8",
        "      render@2+6",
        "        (anonymous)@4+4",
        "      flush@8+2",
      ]);
    });

    it("ends the open frames with the event they run in", () => {
      const chart = parseFlameChart(
        traceOf(
          profile,
          complete("RunTask", 0, 20),
          complete("FunctionCall", 1, 9),
          samples([2, 4], [4, 4]),
        ),
      );

      expect(outline(chart.entries)).toEqual([
        "Task@0+20",
        "  Function call@1+9",
        "    main@2+8",
        "      render@2+8",
      ]);
    });

    it("keeps the frames under a nested event open and puts later frames inside it", () => {
      const chart = parseFlameChart(
        traceOf(
          profile,
          complete("RunTask", 0, 30),
          complete("FunctionCall", 1, 25),
          complete("Layout", 6, 4),
          samples([2, 4], [7, 6], [12, 6], [14, 2]),
        ),
      );

      // The sample at 7 ms says `render` has returned, but Layout started inside
      // `render` and is still running, so the sample cannot be right.
      expect(outline(chart.entries)).toEqual([
        "Task@0+30",
        "  Function call@1+25",
        "    main@2+12",
        "      render@2+10",
        "        Layout@6+4",
        "      flush@12+2",
      ]);
    });

    it("does not let one lost sample split a call in two", () => {
      const chart = parseFlameChart(
        traceOf(
          profile,
          complete("RunTask", 0, 20),
          complete("FunctionCall", 1, 18),
          samples([2, 4], [4, 2], [6, 4], [8, 2]),
        ),
      );

      expect(outline(chart.entries).slice(2)).toEqual(["    main@2+6", "      render@2+6"]);
    });

    it("reads samples outside a JavaScript event when no call is open", () => {
      // A trace can start in the middle of a script, so its event is missing.
      const chart = parseFlameChart(
        traceOf(profile, complete("RunTask", 0, 20), samples([2, 4], [4, 4], [6, 2])),
      );

      expect(outline(chart.entries)).toEqual(["Task@0+20", "  main@2+4", "    render@2+4"]);
    });

    it("colours frames by script, so a file's frames match", () => {
      const chart = parseFlameChart(
        traceOf(
          profile,
          complete("RunTask", 0, 20),
          complete("FunctionCall", 1, 18),
          samples([2, 4], [4, 4]),
        ),
      );
      const [main, render] = chart.entries.filter((entry) => entry.kind === "js");

      expect(main.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(main.color).toBe(render.color);
      expect(main.color).not.toBe("#facc15");
      expect(main.url).toBe(SCRIPT);
    });
  });
});
