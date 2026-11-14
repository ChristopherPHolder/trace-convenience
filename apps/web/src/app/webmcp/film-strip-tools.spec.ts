import { Injector, provideExperimentalWebMcpTools, type WebMcpToolDescriptor } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { traceFile, traceWithScreenshotsAt } from "../../testing/trace-fixture";
import {
  FilmStripExportService,
  type FilmStripExport,
} from "../services/film-strip-export.service";
import { FilmStripSettingsService } from "../services/film-strip-settings.service";
import { FilmStripService } from "../services/film-strip.service";
import { TraceService } from "../services/trace.service";
import { filmStripTools, type FilmStripState, type ToolFailure } from "./film-strip-tools";

describe("filmStripTools", () => {
  let settings: FilmStripSettingsService;
  let traceService: TraceService;

  /** Calls a tool the way Angular does: inside the app's injection context. */
  function call(name: string, input: Record<string, unknown> = {}): unknown {
    const tool = filmStripTools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`No tool named ${name}`);
    return TestBed.runInInjectionContext(() =>
      tool.execute(input, { signal: new AbortController().signal }),
    );
  }

  /** Failures come back as a value: Chrome hides the message of a thrown error. */
  function failure(message: RegExp): ToolFailure {
    return { error: expect.stringMatching(message) as string };
  }

  function loadTrace(timesMs: number[] = [0, 100, 200, 300, 400]): void {
    traceService.addFile(traceFile("checkout.json"), traceWithScreenshotsAt(timesMs));
  }

  beforeEach(() => {
    settings = TestBed.inject(FilmStripSettingsService);
    traceService = TestBed.inject(TraceService);
  });

  it("publishes three uniquely named tools", () => {
    expect(filmStripTools.map((tool) => tool.name)).toEqual([
      "get_film_strip_state",
      "update_film_strip_settings",
      "export_film_strip",
    ]);
  });

  describe("get_film_strip_state", () => {
    it("reports that no trace is loaded", () => {
      const state = call("get_film_strip_state") as FilmStripState;

      expect(state.trace).toBeNull();
      expect(state.frames).toEqual({ count: 0, timesMs: [], timesTruncated: false });
    });

    it("reports the trace, the settings and the frame times", () => {
      loadTrace();

      expect(call("get_film_strip_state")).toEqual({
        trace: { fileName: "checkout.json", screenshotCount: 5, durationMs: 400 },
        settings: {
          intervalMs: 100,
          timeRangeEnabled: false,
          timeRangeStartMs: 0,
          timeRangeEndMs: 0,
          showTimestamps: true,
        },
        frames: { count: 5, timesMs: [0, 100, 200, 300, 400], timesTruncated: false },
      });
    });

    it("reports intervalMs 0 when the strip shows every screenshot", () => {
      loadTrace([0, 30, 400]);
      settings.setUseIntervalFiltering(false);

      const state = call("get_film_strip_state") as FilmStripState;

      expect(state.settings.intervalMs).toBe(0);
      expect(state.frames.timesMs).toEqual([0, 30, 400]);
    });

    it("caps the frame times of a long strip", () => {
      loadTrace([0, 5000]);
      settings.setMinIntervalMs(10);

      const state = call("get_film_strip_state") as FilmStripState;

      expect(state.frames.count).toBe(501);
      expect(state.frames.timesMs).toHaveLength(200);
      expect(state.frames.timesTruncated).toBe(true);
    });

    it("is marked read-only and as carrying untrusted content", () => {
      const tool = filmStripTools[0];

      expect(tool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    });
  });

  describe("update_film_strip_settings", () => {
    it("fails when no trace is loaded", () => {
      expect(call("update_film_strip_settings", { intervalMs: 50 })).toEqual(
        failure(/No trace is loaded/),
      );
    });

    it("sets the interval and returns the new state", () => {
      loadTrace();

      const state = call("update_film_strip_settings", { intervalMs: 200 }) as FilmStripState;

      expect(settings.minIntervalMs()).toBe(200);
      expect(state.settings.intervalMs).toBe(200);
      expect(state.frames.timesMs).toEqual([0, 200, 400]);
    });

    it("shows every screenshot when the interval is 0", () => {
      loadTrace();

      call("update_film_strip_settings", { intervalMs: 0 });

      expect(settings.useIntervalFiltering()).toBe(false);
      // The slider keeps its value for when sampling is turned back on.
      expect(settings.minIntervalMs()).toBe(100);
    });

    it("turns the time range on when a bound is set", () => {
      loadTrace();

      const state = call("update_film_strip_settings", {
        timeRangeStartMs: 100,
        timeRangeEndMs: 300,
      }) as FilmStripState;

      expect(settings.useTimeRangeFilter()).toBe(true);
      expect(state.settings).toMatchObject({
        timeRangeEnabled: true,
        timeRangeStartMs: 100,
        timeRangeEndMs: 300,
      });
      expect(state.frames.timesMs).toEqual([100, 200, 300]);
    });

    it("uses the end of the trace when only the start is set", () => {
      loadTrace();

      call("update_film_strip_settings", { timeRangeStartMs: 200 });

      expect(settings.useTimeRangeFilter()).toBe(true);
      expect((call("get_film_strip_state") as FilmStripState).frames.timesMs).toEqual([
        200, 300, 400,
      ]);
    });

    it("turns the time range off and keeps the window", () => {
      loadTrace();
      call("update_film_strip_settings", { timeRangeStartMs: 100, timeRangeEndMs: 300 });

      const state = call("update_film_strip_settings", {
        timeRangeEnabled: false,
      }) as FilmStripState;

      expect(state.settings).toMatchObject({
        timeRangeEnabled: false,
        timeRangeStartMs: 100,
        timeRangeEndMs: 300,
      });
      expect(state.frames.count).toBe(5);
    });

    it("toggles the timestamps", () => {
      loadTrace();

      call("update_film_strip_settings", { showTimestamps: false });

      expect(settings.exportShowTimestamps()).toBe(false);
    });

    it.each([
      [{}, /at least one setting/],
      [{ interval: 50 }, /Unknown settings: interval/],
      [{ intervalMs: 5 }, /intervalMs must be 0 or from 10 to 2000/],
      [{ intervalMs: 2500 }, /intervalMs must be 0 or from 10 to 2000/],
      [{ intervalMs: "50" }, /intervalMs must be a whole number/],
      [{ intervalMs: 12.5 }, /intervalMs must be a whole number/],
      [{ showTimestamps: "yes" }, /showTimestamps must be true or false/],
      [{ timeRangeStartMs: 300, timeRangeEndMs: 100 }, /time range must satisfy/],
      [{ timeRangeStartMs: -1, timeRangeEndMs: 100 }, /time range must satisfy/],
      [{ timeRangeEndMs: 401 }, /<= 400/],
    ])("rejects %j", (input, message) => {
      loadTrace();

      expect(call("update_film_strip_settings", input)).toEqual(failure(message));
    });

    it("changes nothing when one value is invalid", () => {
      loadTrace();

      expect(call("update_film_strip_settings", { intervalMs: 500, showTimestamps: "no" })).toEqual(
        failure(/showTimestamps must be true or false/),
      );

      expect(settings.minIntervalMs()).toBe(100);
      expect(settings.exportShowTimestamps()).toBe(true);
    });
  });

  describe("export_film_strip", () => {
    const exported: FilmStripExport = {
      fileName: "film-strip-1.png",
      format: "png",
      frameCount: 5,
      width: 1200,
      height: 250,
    };
    let download: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      download = vi
        .spyOn(TestBed.inject(FilmStripExportService), "download")
        .mockResolvedValue(exported);
    });

    it("downloads the displayed frames and reports the file", async () => {
      loadTrace();

      await expect(call("export_film_strip", { format: "png" })).resolves.toEqual(exported);

      expect(download).toHaveBeenCalledWith("png", TestBed.inject(FilmStripService).frames());
    });

    it("fails when no trace is loaded", () => {
      expect(call("export_film_strip", { format: "png" })).toEqual(failure(/No trace is loaded/));
      expect(download).not.toHaveBeenCalled();
    });

    it("reports why the export failed", async () => {
      loadTrace();
      download.mockRejectedValue(new Error("The browser could not encode the PNG."));

      await expect(call("export_film_strip", { format: "png" })).resolves.toEqual({
        error: "The export failed. The browser could not encode the PNG.",
      });
    });

    it("fails when the trace has no screenshots", () => {
      loadTrace([]);

      expect(call("export_film_strip", { format: "gif" })).toEqual(failure(/no screenshots/));
    });

    it.each([[{}], [{ format: "jpeg" }], [{ format: 1 }]])("rejects the format in %j", (input) => {
      loadTrace();

      expect(call("export_film_strip", input)).toEqual(failure(/format must be "png" or "gif"/));
      expect(download).not.toHaveBeenCalled();
    });
  });
});

describe("filmStripTools registration", () => {
  const registerTool = vi.fn<(tool: WebMcpToolDescriptor) => Promise<void>>();

  beforeEach(() => {
    registerTool.mockReset().mockResolvedValue();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool },
    });
    TestBed.configureTestingModule({
      providers: [provideExperimentalWebMcpTools(filmStripTools)],
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "modelContext");
  });

  it("registers every tool with the browser when the app starts", () => {
    TestBed.inject(Injector);

    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      "get_film_strip_state",
      "update_film_strip_settings",
      "export_film_strip",
    ]);
  });

  it("runs a registered tool against the app's services", () => {
    TestBed.inject(TraceService).addFile(traceFile(), traceWithScreenshotsAt([0, 100]));
    const [[registered]] = registerTool.mock.calls;

    // The browser calls `execute` with no injection context; Angular supplies it.
    const state = registered.execute({}, { signal: new AbortController().signal });

    expect((state as FilmStripState).trace?.screenshotCount).toBe(2);
  });
});
