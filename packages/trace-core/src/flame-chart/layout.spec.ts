import { describe, expect, it } from "vite-plus/test";
import { clampTimeRange, layoutFlameChart, snapTimeRangeToTasks } from "./layout";
import type { FlameChart, FlameChartEntry } from "./types";

const T0 = 5_000_000;

/** An entry placed in ms from the start of the trace. */
const entry = (
  name: string,
  depth: number,
  startMs: number,
  durMs: number,
  overrides: Partial<FlameChartEntry> = {},
): FlameChartEntry => ({
  name,
  kind: "event",
  category: "scripting",
  color: "#facc15",
  start: T0 + startMs * 1000,
  duration: durMs * 1000,
  selfTime: durMs * 1000,
  depth,
  url: "",
  ...overrides,
});

/** A chart that spans `durationMs`. Entries must be in call-tree order. */
const chartOf = (durationMs: number, ...entries: FlameChartEntry[]): FlameChart => ({
  thread: { processId: 1, threadId: 1, name: "CrRendererMain" },
  entries,
  startTime: T0,
  endTime: T0 + durationMs * 1000,
  maxDepth: Math.max(-1, ...entries.map((item) => item.depth)),
});

const task = (startMs: number, durMs: number) =>
  entry("Task", 0, startMs, durMs, { category: "system", color: "#c7c7c7" });

describe("layoutFlameChart", () => {
  it("places each entry by its time and its depth", () => {
    const chart = chartOf(100, task(0, 100), entry("Function call", 1, 25, 50));

    const layout = layoutFlameChart(chart, { width: 1000 });

    expect(layout.timeRange).toEqual({ startMs: 0, endMs: 100 });
    expect(layout.bars).toMatchObject([
      { entryIndex: 0, x: 0, y: 22, width: 999.5, height: 16, color: "#c7c7c7" },
      { entryIndex: 1, x: 250, y: 39, width: 499.5, height: 16, color: "#facc15" },
    ]);
    expect(layout).toMatchObject({ width: 1000, height: 22 + 2 * 17, axisHeight: 22 });
  });

  it("shows only the entries in the time range and cuts them off at its edges", () => {
    const chart = chartOf(
      100,
      task(0, 30),
      entry("Function call", 1, 5, 10),
      task(40, 20),
      entry("Layout", 1, 45, 10),
      task(70, 10),
    );

    const layout = layoutFlameChart(chart, { width: 1000, timeRange: { startMs: 20, endMs: 50 } });

    expect(layout.bars.map((bar) => [bar.entryIndex, bar.x, bar.width])).toEqual([
      // Runs from before the range to 30 ms: a third of the width.
      [0, 0, 332.83],
      // Starts at 40 ms and runs past the end.
      [2, 666.67, 332.83],
      [3, 833.33, 166.17],
    ]);
  });

  it("is as tall as the deepest entry in the range", () => {
    const chart = chartOf(
      100,
      task(0, 10),
      entry("a", 1, 0, 10),
      entry("b", 2, 0, 10),
      task(50, 10),
    );

    expect(layoutFlameChart(chart).height).toBe(22 + 3 * 17);
    expect(layoutFlameChart(chart, { timeRange: { startMs: 40, endMs: 100 } }).height).toBe(
      22 + 17,
    );
    expect(layoutFlameChart(chart, { timeRange: { startMs: 20, endMs: 30 } }).height).toBe(22 + 17);
  });

  it("can leave out the axis, the labels and the deep entries, for an overview", () => {
    const chart = chartOf(100, task(0, 100), entry("a", 1, 0, 100), entry("b", 2, 0, 100));

    const layout = layoutFlameChart(chart, {
      width: 200,
      rowHeight: 4,
      maxDepth: 1,
      showAxis: false,
      showLabels: false,
    });

    expect(layout).toMatchObject({ height: 8, axisHeight: 0, ticks: [] });
    expect(layout.bars.map((bar) => [bar.y, bar.height, bar.label])).toEqual([
      [0, 3, ""],
      [4, 3, ""],
    ]);
  });

  describe("labels", () => {
    it("writes the name and the duration where both fit", () => {
      const chart = chartOf(100, entry("Function call", 0, 0, 100));

      const [bar] = layoutFlameChart(chart, { width: 1000 }).bars;

      expect(bar).toMatchObject({ label: "Function call", detail: "100.0 ms" });
    });

    it("drops the duration before it cuts the name", () => {
      const chart = chartOf(100, entry("Function call", 0, 0, 100));

      const [bar] = layoutFlameChart(chart, { width: 90 }).bars;

      expect(bar).toMatchObject({ label: "Function call", detail: "" });
    });

    it("cuts a name that does not fit and ends it with an ellipsis", () => {
      const chart = chartOf(100, entry("Recalculate style", 0, 0, 100));

      const [bar] = layoutFlameChart(chart, { width: 60 }).bars;

      expect(bar).toMatchObject({ label: "Recalc…", detail: "" });
    });

    it("leaves a narrow bar without text", () => {
      const chart = chartOf(100, entry("Layout", 0, 0, 1));

      const [bar] = layoutFlameChart(chart, { width: 1000 }).bars;

      expect(bar).toMatchObject({ width: 9.5, label: "", detail: "" });
    });

    it("leaves durations out when asked to", () => {
      const chart = chartOf(100, entry("Function call", 0, 0, 100));

      const [bar] = layoutFlameChart(chart, { width: 1000, showDurations: false }).bars;

      expect(bar).toMatchObject({ label: "Function call", detail: "" });
    });

    it("describes the entry in full for a tooltip", () => {
      const chart = chartOf(
        100,
        entry("render", 0, 0, 12.5, {
          kind: "js",
          selfTime: 500,
          url: "https://example.com/app.js",
        }),
      );

      const [bar] = layoutFlameChart(chart).bars;

      expect(bar.title).toBe("render\n12.5 ms (self 500 μs)\nhttps://example.com/app.js");
    });
  });

  describe("slivers", () => {
    it("draws an entry narrower than a pixel one pixel wide", () => {
      const chart = chartOf(1000, entry("Layout", 0, 500, 0.1));

      const [bar] = layoutFlameChart(chart, { width: 1000 }).bars;

      expect(bar).toMatchObject({ x: 500, width: 0.5 });
    });

    it("draws one sliver per pixel column of a row", () => {
      const chart = chartOf(
        1000,
        entry("a", 0, 500.1, 0.1),
        entry("b", 0, 500.4, 0.1),
        entry("c", 0, 500.7, 0.1),
        entry("d", 0, 501.2, 0.1),
      );

      const layout = layoutFlameChart(chart, { width: 1000 });

      expect(layout.bars.map((bar) => bar.entryIndex)).toEqual([0, 3]);
    });

    it("keeps a sliver at the right edge inside the chart", () => {
      const chart = chartOf(1000, entry("Layout", 0, 999.9, 0.1));

      const [bar] = layoutFlameChart(chart, { width: 1000 }).bars;

      expect(bar.x + bar.width).toBeLessThanOrEqual(1000);
    });
  });

  describe("the time axis", () => {
    const ticksOf = (durationMs: number, width = 1000) =>
      layoutFlameChart(chartOf(durationMs, task(0, durationMs)), { width }).ticks;

    it("puts ticks at round times, counted from the start of the range", () => {
      const chart = chartOf(1000, task(0, 1000));

      const layout = layoutFlameChart(chart, {
        width: 1000,
        timeRange: { startMs: 300, endMs: 800 },
      });

      expect(layout.ticks.map((tick) => [tick.x, tick.label])).toEqual([
        [0, "0 ms"],
        [100, "50 ms"],
        [200, "100 ms"],
        [300, "150 ms"],
        [400, "200 ms"],
        [500, "250 ms"],
        [600, "300 ms"],
        [700, "350 ms"],
        [800, "400 ms"],
        [900, "450 ms"],
      ]);
    });

    it("counts in seconds on a long range", () => {
      expect(ticksOf(20_000).map((tick) => tick.label)).toEqual([
        "0 s",
        "2 s",
        "4 s",
        "6 s",
        "8 s",
        "10 s",
        "12 s",
        "14 s",
        "16 s",
        "18 s",
      ]);
    });

    it("keeps decimals on a short range", () => {
      expect(ticksOf(2).map((tick) => tick.label)).toEqual([
        "0.0 ms",
        "0.2 ms",
        "0.4 ms",
        "0.6 ms",
        "0.8 ms",
        "1.0 ms",
        "1.2 ms",
        "1.4 ms",
        "1.6 ms",
        "1.8 ms",
      ]);
    });

    it("drops a tick whose label would run off the right edge", () => {
      // The tick at 180 ms would sit 5.5 px from the edge.
      const labels = ticksOf(181).map((tick) => tick.label);

      expect(labels.at(-1)).toBe("160 ms");
    });
  });

  describe("long tasks", () => {
    it("marks the part of a task past 50 ms", () => {
      const chart = chartOf(200, task(0, 150), task(160, 40));

      const layout = layoutFlameChart(chart, { width: 1000 });

      expect(layout.longTaskOverruns).toEqual([{ x: 250, y: 22, width: 499.5, height: 16 }]);
    });

    it("marks only tasks, not long events inside them", () => {
      const chart = chartOf(200, task(0, 40), entry("Function call", 0, 50, 100));

      expect(layoutFlameChart(chart).longTaskOverruns).toEqual([]);
    });

    it("marks the whole visible part when the range starts after the first 50 ms", () => {
      const chart = chartOf(200, task(0, 200));

      const layout = layoutFlameChart(chart, {
        width: 1000,
        timeRange: { startMs: 100, endMs: 200 },
      });

      expect(layout.longTaskOverruns).toEqual([{ x: 0, y: 22, width: 999.5, height: 16 }]);
    });
  });
});

describe("clampTimeRange", () => {
  const chart = chartOf(100, task(0, 100));

  it("defaults to the whole trace", () => {
    expect(clampTimeRange(chart)).toEqual({ startMs: 0, endMs: 100 });
  });

  it("keeps the range inside the trace", () => {
    expect(clampTimeRange(chart, { startMs: -20, endMs: 250 })).toEqual({ startMs: 0, endMs: 100 });
  });

  it("does not let the range end before it starts", () => {
    expect(clampTimeRange(chart, { startMs: 60, endMs: 40 })).toEqual({ startMs: 60, endMs: 60 });
  });

  it("falls back to the trace's bounds for values that are not numbers", () => {
    expect(clampTimeRange(chart, { startMs: NaN, endMs: NaN })).toEqual({ startMs: 0, endMs: 100 });
  });
});

describe("snapTimeRangeToTasks", () => {
  const chart = chartOf(
    100,
    task(10, 20),
    entry("Function call", 1, 12, 5),
    task(40, 10),
    task(70, 20),
  );

  it("widens the range to the tasks it cuts through", () => {
    expect(snapTimeRangeToTasks(chart, { startMs: 25, endMs: 45 })).toEqual({
      startMs: 10,
      endMs: 50,
    });
  });

  it("drops the idle time around the tasks", () => {
    expect(snapTimeRangeToTasks(chart, { startMs: 35, endMs: 65 })).toEqual({
      startMs: 40,
      endMs: 50,
    });
  });

  it("leaves a range that touches no task as it is", () => {
    expect(snapTimeRangeToTasks(chart, { startMs: 52, endMs: 68 })).toEqual({
      startMs: 52,
      endMs: 68,
    });
  });
});
