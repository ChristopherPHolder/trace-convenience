import { TestBed } from "@angular/core/testing";
import {
  layoutFlameChart,
  parseFlameChart,
  type FlameChartLayout,
} from "@trace-convenience/trace-core";
import { traceWithTasksAt } from "../../testing/trace-fixture";
import { FlameChartExportService } from "./flame-chart-export.service";

describe("FlameChartExportService", () => {
  let service: FlameChartExportService;
  let layout: FlameChartLayout;
  let savedBlobs: Blob[];

  beforeEach(() => {
    service = TestBed.inject(FlameChartExportService);
    layout = layoutFlameChart(parseFlameChart(traceWithTasksAt([[0, 100]])));

    // jsdom has no object URLs and cannot follow a download link.
    savedBlobs = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      savedBlobs.push(blob);
      return "blob:flame-chart";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["svg", "png"] as const)(
    "rejects a %s export with nothing in the range",
    async (format) => {
      await expect(service.download(format, { ...layout, bars: [] })).rejects.toThrow(
        "There is nothing in this time range to export.",
      );
    },
  );

  it("downloads the chart as an SVG document", async () => {
    const result = await service.download("svg", layout);

    expect(result).toMatchObject({
      format: "svg",
      barCount: 2,
      width: layout.width,
      height: layout.height,
    });
    expect(result.fileName).toMatch(/^flame-chart-\d+\.svg$/);

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:flame-chart");
    const [svg] = savedBlobs;
    expect(svg.type).toBe("image/svg+xml");
    expect(await svg.text()).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  });

  // jsdom has no canvas, so the PNG is checked in a browser, not here.
});
