import { ComponentFixture, TestBed } from "@angular/core/testing";
import { traceFile, traceWithTasksAt } from "../../../testing/trace-fixture";
import { FlameChartExportService } from "../../services/flame-chart-export.service";
import { FlameChartService } from "../../services/flame-chart.service";
import { TraceService } from "../../services/trace.service";
import { FlameChartComponent } from "./flame-chart";

describe("FlameChartComponent", () => {
  let fixture: ComponentFixture<FlameChartComponent>;
  let element: HTMLElement;
  let flameChart: FlameChartService;
  let traceService: TraceService;

  const query = <T extends Element = HTMLElement>(selector: string) =>
    element.querySelector<T>(selector)!;
  const queryAll = <T extends Element = HTMLElement>(selector: string) =>
    Array.from(element.querySelectorAll<T>(selector));
  const buttonNamed = (text: string) =>
    queryAll<HTMLButtonElement>("button").find((button) => button.textContent?.trim() === text)!;
  const rangeInputs = () => queryAll<HTMLInputElement>(".range-field input");

  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event("change"));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FlameChartComponent] }).compileComponents();
    flameChart = TestBed.inject(FlameChartService);
    traceService = TestBed.inject(TraceService);

    // Three tasks over 100 ms: 0 to 20, 40 to 50 and 80 to 100.
    traceService.addFile(
      traceFile(),
      traceWithTasksAt([
        [0, 20],
        [40, 10],
        [80, 20],
      ]),
    );
    fixture = TestBed.createComponent(FlameChartComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  describe("chart", () => {
    it("draws a bar for every entry, with its name in a tooltip", () => {
      const bars = queryAll<SVGRectElement>(".chart .bars rect");

      expect(bars).toHaveLength(6);
      expect(bars[0].getAttribute("fill")).toBe("#c7c7c7");
      expect(bars[0].querySelector("title")?.textContent).toBe("Task\n20.0 ms (self 10.0 ms)");
    });

    it("writes the name and the duration on a bar that has room", () => {
      const labels = queryAll<SVGTextElement>(".chart g[pointer-events] text");

      expect(labels[0].textContent).toBe("Task20.0 ms");
      expect(labels[0].querySelectorAll("tspan")).toHaveLength(2);
    });

    it("labels the chart for assistive technology", () => {
      const chart = query<SVGSVGElement>(".chart");

      expect(chart.getAttribute("role")).toBe("img");
      expect(chart.getAttribute("aria-label")).toBe(
        "Flame chart of the main thread, from 0 ms to 100 ms",
      );
    });

    it("says how much of the trace is shown", () => {
      expect(query(".flame-chart-meta").textContent).toContain("100.0 ms");

      flameChart.setTimeRange({ startMs: 40, endMs: 50 });
      fixture.detectChanges();

      expect(query(".flame-chart-meta").textContent).toMatch(/10\.0 ms\s+of\s+100\.0 ms/);
    });

    it("cuts to a bar that is double-clicked", () => {
      const bars = queryAll<SVGRectElement>(".chart .bars rect");

      bars[2].dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      fixture.detectChanges();

      expect(flameChart.timeRange()).toEqual({ startMs: 40, endMs: 50 });
      expect(queryAll(".chart .bars rect")).toHaveLength(2);
    });

    it("shows an empty state for a trace without main thread activity", () => {
      traceService.clearAll();
      traceService.addFile(traceFile(), { traceEvents: [] });
      fixture.detectChanges();

      expect(query(".flame-chart-empty").textContent).toContain("No main thread activity found");
      expect(element.querySelector(".chart")).toBeNull();
    });
  });

  describe("time range", () => {
    it("shows the range in the start and end fields", () => {
      flameChart.setTimeRange({ startMs: 12.34, endMs: 56.78 });
      fixture.detectChanges();

      expect(rangeInputs().map((input) => input.value)).toEqual(["12.3", "56.8"]);
    });

    it("cuts the chart to a typed start and end", () => {
      const [start, end] = rangeInputs();

      type(start, "40");
      type(end, "50");

      expect(flameChart.timeRange()).toEqual({ startMs: 40, endMs: 50 });
      expect(queryAll(".chart .bars rect")).toHaveLength(2);
    });

    it("ignores a field that is cleared", () => {
      type(rangeInputs()[0], "");

      expect(flameChart.timeRange()).toEqual({ startMs: 0, endMs: 100 });
    });

    it("places the selection over the range on the overview", () => {
      flameChart.setTimeRange({ startMs: 25, endMs: 75 });
      fixture.detectChanges();

      const selection = query(".overview-selection");
      expect(selection.style.left).toBe("25%");
      expect(selection.style.width).toBe("50%");
    });

    it("moves an edge of the range with the arrow keys", () => {
      const press = (handle: string, key: string, shiftKey = false) => {
        query(handle).dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey }));
        fixture.detectChanges();
      };

      press(".overview-handle-start", "ArrowRight", true);
      press(".overview-handle-end", "ArrowLeft");

      expect(flameChart.timeRange()).toEqual({ startMs: 5, endMs: 99.5 });

      press(".overview-handle-start", "Home");
      press(".overview-handle-end", "End");

      expect(flameChart.timeRange()).toEqual({ startMs: 0, endMs: 100 });
    });

    it("exposes each handle as a slider", () => {
      flameChart.setTimeRange({ startMs: 25, endMs: 75 });
      fixture.detectChanges();

      const start = query(".overview-handle-start");
      expect(start.getAttribute("role")).toBe("slider");
      expect(start.getAttribute("aria-label")).toBe("Start of the time range");
      expect(start.getAttribute("aria-valuenow")).toBe("25");
      expect(start.getAttribute("aria-valuemax")).toBe("75");
      expect(query(".overview-handle-end").getAttribute("aria-valuenow")).toBe("75");
    });

    it("snaps the range to whole tasks", () => {
      flameChart.setTimeRange({ startMs: 45, endMs: 85 });
      fixture.detectChanges();

      buttonNamed("Snap to tasks").click();

      expect(flameChart.timeRange()).toEqual({ startMs: 40, endMs: 100 });
    });

    it("goes back to the whole trace", () => {
      expect(buttonNamed("Whole trace").getAttribute("aria-disabled")).toBe("true");
      expect(element.querySelector(".overview-grip")).toBeNull();

      flameChart.setTimeRange({ startMs: 40, endMs: 50 });
      fixture.detectChanges();
      expect(element.querySelector(".overview-grip")).not.toBeNull();
      buttonNamed("Whole trace").click();

      expect(flameChart.timeRange()).toEqual({ startMs: 0, endMs: 100 });
    });

    it("turns the durations on the bars off", () => {
      query('button[role="switch"]').click();
      fixture.detectChanges();

      expect(flameChart.showDurations()).toBe(false);
      expect(queryAll(".chart g[pointer-events] text")[0].textContent).toBe("Task");
    });
  });

  describe("download", () => {
    it.each([
      ["svg", "Download flame chart as SVG"],
      ["png", "Download flame chart as PNG"],
    ] as const)("downloads the chart on the page as %s", async (format, label) => {
      const download = vi
        .spyOn(TestBed.inject(FlameChartExportService), "download")
        .mockResolvedValue({ fileName: "x", format, barCount: 6, width: 1, height: 1 });

      query<HTMLButtonElement>(`button[aria-label="${label}"]`).click();
      await fixture.whenStable();

      expect(download).toHaveBeenCalledExactlyOnceWith(format, flameChart.layout());
    });

    it("says why a download failed", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(TestBed.inject(FlameChartExportService), "download").mockRejectedValue(
        new Error("The browser could not encode the PNG."),
      );

      query<HTMLButtonElement>('button[aria-label="Download flame chart as PNG"]').click();
      await fixture.whenStable();
      fixture.detectChanges();

      const error = query(".export-error");
      expect(error.getAttribute("role")).toBe("alert");
      expect(error.textContent).toContain("The browser could not encode the PNG.");
    });
  });
});
