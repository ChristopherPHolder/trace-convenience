import { TestBed } from "@angular/core/testing";
import { traceFile, traceWithTasksAt } from "../../testing/trace-fixture";
import { FlameChartService } from "./flame-chart.service";
import { TraceService } from "./trace.service";

describe("FlameChartService", () => {
  let service: FlameChartService;
  let traceService: TraceService;

  /** Three tasks over 100 ms: 0 to 20, 40 to 50 and 80 to 100. */
  const loadTrace = () =>
    traceService.addFile(
      traceFile(),
      traceWithTasksAt([
        [0, 20],
        [40, 10],
        [80, 20],
      ]),
    );

  const entryNamesInLayout = () => {
    const entries = service.chart()?.entries ?? [];
    return service.layout()?.bars.map((bar) => entries[bar.entryIndex].name);
  };

  beforeEach(() => {
    service = TestBed.inject(FlameChartService);
    traceService = TestBed.inject(TraceService);
  });

  it("has no chart until a trace is loaded", () => {
    expect(service.chart()).toBeNull();
    expect(service.layout()).toBeNull();
    expect(service.overview()).toBeNull();
    expect(service.hasEntries()).toBe(false);
    expect(service.durationMs()).toBe(0);
  });

  it("reads the main thread of the loaded trace", () => {
    loadTrace();

    expect(service.hasEntries()).toBe(true);
    expect(service.durationMs()).toBe(100);
    expect(service.chart()?.entries.map((entry) => entry.name)).toEqual([
      "Task",
      "Function call",
      "Task",
      "Function call",
      "Task",
      "Function call",
    ]);
  });

  it("has no entries for a file that is not a trace", () => {
    traceService.addFile(traceFile(), { test: "data" });

    expect(service.hasEntries()).toBe(false);
  });

  it("shows the whole trace at first", () => {
    loadTrace();

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 100 });
    expect(service.isWholeTrace()).toBe(true);
    expect(service.layout()?.bars).toHaveLength(6);
  });

  it("cuts the chart to the time range", () => {
    loadTrace();

    service.setTimeRange({ startMs: 30, endMs: 60 });

    expect(service.isWholeTrace()).toBe(false);
    expect(service.layout()?.timeRange).toEqual({ startMs: 30, endMs: 60 });
    expect(entryNamesInLayout()).toEqual(["Task", "Function call"]);
  });

  it("keeps the time range inside the trace", () => {
    loadTrace();

    service.setTimeRange({ startMs: -50, endMs: 500 });

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 100 });
  });

  it("does not let the time range collapse to nothing", () => {
    loadTrace();

    service.setTimeRange({ startMs: 100, endMs: 100 });

    const { startMs, endMs } = service.timeRange();
    expect(endMs).toBe(100);
    expect(endMs - startMs).toBeCloseTo(0.1);
  });

  it("snaps the range to the tasks it touches", () => {
    loadTrace();
    service.setTimeRange({ startMs: 45, endMs: 85 });

    service.snapToTasks();

    expect(service.timeRange()).toEqual({ startMs: 40, endMs: 100 });
  });

  it("cuts to one entry", () => {
    loadTrace();

    service.cutToEntry(3);

    expect(service.timeRange()).toEqual({ startMs: 40, endMs: 45 });
  });

  it("ignores an entry that does not exist", () => {
    loadTrace();

    service.cutToEntry(99);

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 100 });
  });

  it("goes back to the whole trace", () => {
    loadTrace();
    service.setTimeRange({ startMs: 30, endMs: 60 });

    service.resetTimeRange();

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 100 });
  });

  it("starts over with the whole trace when another trace is loaded", () => {
    loadTrace();
    service.setTimeRange({ startMs: 30, endMs: 60 });

    traceService.clearAll();
    traceService.addFile(traceFile(), traceWithTasksAt([[0, 40]]));

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 40 });
  });

  it("starts over even when the next trace is just as long", () => {
    loadTrace();
    service.setTimeRange({ startMs: 30, endMs: 60 });

    traceService.clearAll();
    traceService.addFile(traceFile(), traceWithTasksAt([[0, 100]]));

    expect(service.timeRange()).toEqual({ startMs: 0, endMs: 100 });
  });

  it("writes durations on the bars until they are turned off", () => {
    traceService.addFile(traceFile(), traceWithTasksAt([[0, 100]]));
    expect(service.layout()?.bars[0]).toMatchObject({ label: "Task", detail: "100.0 ms" });

    service.setShowDurations(false);

    expect(service.showDurations()).toBe(false);
    expect(service.layout()?.bars[0]).toMatchObject({ label: "Task", detail: "" });
  });

  it("draws the whole trace in the overview, whatever the range", () => {
    loadTrace();

    service.setTimeRange({ startMs: 30, endMs: 60 });

    expect(service.overview()).toMatchObject({
      timeRange: { startMs: 0, endMs: 100 },
      axisHeight: 0,
    });
    expect(service.overview()?.bars).toHaveLength(6);
  });
});
