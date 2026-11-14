import { Injectable } from "@angular/core";
import { renderFlameChartSvg, type FlameChartLayout } from "@trace-convenience/trace-core";
import { downloadBlob } from "./download";

export type FlameChartExportFormat = "svg" | "png";

/** What a download produced. */
export interface FlameChartExport {
  fileName: string;
  format: FlameChartExportFormat;
  barCount: number;
  /** Size of the image in px. */
  width: number;
  height: number;
}

/** The PNG has this many pixels per px of the chart, so text stays sharp. */
const PNG_SCALE = 2;
/** Browsers refuse a canvas beyond about this many pixels, or this long a side. */
const MAX_CANVAS_AREA = 16_000_000;
const MAX_CANVAS_SIDE = 16_384;

/**
 * Downloads a flame chart. The SVG is the document `trace-core` renders. The
 * PNG is that same document drawn on a canvas, so the two cannot differ.
 */
@Injectable({
  providedIn: "root",
})
export class FlameChartExportService {
  /** Downloads `layout` in the given format. Rejects when the image cannot be made. */
  async download(
    format: FlameChartExportFormat,
    layout: FlameChartLayout,
  ): Promise<FlameChartExport> {
    if (layout.bars.length === 0) {
      throw new Error("There is nothing in this time range to export.");
    }

    const svg = new Blob([renderFlameChartSvg(layout)], { type: "image/svg+xml" });
    const fileName = `flame-chart-${Date.now()}.${format}`;
    const result = { fileName, format, barCount: layout.bars.length };

    if (format === "svg") {
      downloadBlob(svg, fileName);
      return { ...result, width: layout.width, height: layout.height };
    }

    const scale = Math.min(
      PNG_SCALE,
      Math.sqrt(MAX_CANVAS_AREA / (layout.width * layout.height)),
      MAX_CANVAS_SIDE / layout.height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(layout.width * scale);
    canvas.height = Math.round(layout.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot draw on a 2D canvas.");

    context.drawImage(await loadImage(svg), 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("The browser could not encode the PNG.");

    downloadBlob(png, fileName);
    return { ...result, width: canvas.width, height: canvas.height };
  }
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The browser could not draw the flame chart."));
    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}
