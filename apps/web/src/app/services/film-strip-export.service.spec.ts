import { TestBed } from "@angular/core/testing";
import { FilmStripExportService } from "./film-strip-export.service";

describe("FilmStripExportService", () => {
  // jsdom has no canvas, so drawing is checked in a browser, not here.
  it.each(["png", "gif"] as const)("rejects a %s export with no frames", async (format) => {
    const service = TestBed.inject(FilmStripExportService);

    await expect(service.download(format, [])).rejects.toThrow("There are no frames to export.");
  });
});
