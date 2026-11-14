import { TestBed } from "@angular/core/testing";
import { traceFile, traceWithScreenshotsAt } from "../../testing/trace-fixture";
import { FilmStripSettingsService } from "./film-strip-settings.service";
import { FilmStripService } from "./film-strip.service";
import { TraceService } from "./trace.service";

describe("FilmStripService", () => {
  let service: FilmStripService;
  let settings: FilmStripSettingsService;
  let traceService: TraceService;

  beforeEach(() => {
    service = TestBed.inject(FilmStripService);
    settings = TestBed.inject(FilmStripSettingsService);
    traceService = TestBed.inject(TraceService);
    settings.setUseIntervalFiltering(false);
  });

  it("has no frames until a trace is loaded", () => {
    expect(service.screenshots()).toEqual([]);
    expect(service.frames()).toEqual([]);
    expect(service.totalDurationMs()).toBe(0);
  });

  it("shows every screenshot of the loaded trace", () => {
    traceService.addFile(traceFile(), traceWithScreenshotsAt([0, 100, 250]));

    expect(service.frames().map((frame) => frame.relativeTime)).toEqual(["0ms", "100ms", "250ms"]);
    expect(service.totalDurationMs()).toBe(250);
  });

  it("re-samples the frames when interval sampling is on", () => {
    traceService.addFile(traceFile(), traceWithScreenshotsAt([0, 100, 250]));

    settings.setUseIntervalFiltering(true);
    settings.setMinIntervalMs(50);

    expect(service.frames().map((frame) => frame.relativeTime)).toEqual([
      "0ms",
      "50ms",
      "100ms",
      "150ms",
      "200ms",
      "250ms",
    ]);
  });

  it("limits the frames to the time range", () => {
    traceService.addFile(traceFile(), traceWithScreenshotsAt([0, 100, 200, 300, 400]));

    settings.setStartTimeMs(100);
    settings.setEndTimeMs(300);
    settings.setUseTimeRangeFilter(true);

    expect(service.frames().map((frame) => frame.data)).toEqual(["frame1", "frame2", "frame3"]);
  });

  it("applies the settings to screenshots it is given", () => {
    const screenshots = [
      { timestamp: 1_000_000, data: "a", format: "jpeg" as const },
      { timestamp: 2_000_000, data: "b", format: "jpeg" as const },
    ];

    const frames = service.selectFrames(screenshots, 0);

    expect(frames.map((frame) => frame.relativeTime)).toEqual(["1.00s", "2.00s"]);
  });
});
