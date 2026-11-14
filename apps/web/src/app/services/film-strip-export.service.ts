import { Injectable, inject } from "@angular/core";
import { toDataUri, type FilmStripFrame } from "@trace-convenience/trace-core";
import { FilmStripSettingsService } from "./film-strip-settings.service";

export type FilmStripExportFormat = "png" | "gif";

/** What a download produced. */
export interface FilmStripExport {
  fileName: string;
  format: FilmStripExportFormat;
  frameCount: number;
  /** Size of the image in pixels. */
  width: number;
  height: number;
}

/** Delay between the frames of the GIF, in ms. */
const GIF_FRAME_DELAY_MS = 500;

/**
 * Draws film strip frames on a canvas and downloads the result. The PNG is one
 * image with the frames side by side; the GIF shows them one after another.
 */
@Injectable({
  providedIn: "root",
})
export class FilmStripExportService {
  private readonly settingsService = inject(FilmStripSettingsService);

  /** Downloads `frames` in the given format. Rejects when the image cannot be made. */
  download(
    format: FilmStripExportFormat,
    frames: readonly FilmStripFrame[],
  ): Promise<FilmStripExport> {
    if (frames.length === 0) {
      return Promise.reject(new Error("There are no frames to export."));
    }
    return format === "gif" ? this.downloadGif(frames) : this.downloadPng(frames);
  }

  private async downloadPng(frames: readonly FilmStripFrame[]): Promise<FilmStripExport> {
    // Create a canvas to composite all screenshots
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot draw on a 2D canvas.");

    const settings = this.settingsService.getSettings();
    const padding = settings.exportPadding;
    const showTimestamps = settings.exportShowTimestamps;
    const textHeight = showTimestamps ? 30 : 0;
    const maxImageHeight = settings.exportImageHeight;

    const images = await loadImages(frames);

    // Calculate total width and set canvas size
    let totalWidth = 0;
    for (const img of images) {
      const aspectRatio = img.width / img.height;
      const scaledWidth = maxImageHeight * aspectRatio;
      totalWidth += scaledWidth + padding;
    }

    canvas.width = totalWidth + padding;
    canvas.height = maxImageHeight + textHeight + padding * 2;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each screenshot with its timestamp
    let xOffset = padding;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const frame = frames[i];
      const aspectRatio = img.width / img.height;
      const scaledWidth = maxImageHeight * aspectRatio;

      // Draw image
      ctx.drawImage(img, xOffset, padding, scaledWidth, maxImageHeight);

      // Draw timestamp below if enabled
      if (showTimestamps) {
        ctx.fillStyle = "#1f2937";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(frame.relativeTime, xOffset + scaledWidth / 2, maxImageHeight + padding + 20);
      }

      xOffset += scaledWidth + padding;
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("The browser could not encode the PNG.");

    return {
      fileName: downloadBlob(blob, "png"),
      format: "png",
      frameCount: frames.length,
      width: canvas.width,
      height: canvas.height,
    };
  }

  private async downloadGif(frames: readonly FilmStripFrame[]): Promise<FilmStripExport> {
    // gifenc is only needed here, so it stays out of the initial bundle.
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");

    const settings = this.settingsService.getSettings();
    const showTimestamps = settings.exportShowTimestamps;
    // Use higher resolution for better quality (2x the export height)
    const maxImageHeight = settings.exportImageHeight * 2;

    const images = await loadImages(frames);

    // Use first image to determine dimensions
    const firstImg = images[0];
    const aspectRatio = firstImg.width / firstImg.height;
    const scaledWidth = Math.round(maxImageHeight * aspectRatio);
    const textHeight = showTimestamps ? 60 : 0;
    const canvasHeight = maxImageHeight + textHeight;

    // Create GIF encoder
    const gif = GIFEncoder();

    // Create a global palette from all frames for better color consistency
    const allImageData: Uint8ClampedArray[] = [];
    const frameCanvases: HTMLCanvasElement[] = [];

    // Pre-render all frames and collect image data
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const frame = frames[i];

      // Create canvas for this frame
      const canvas = document.createElement("canvas");
      canvas.width = scaledWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });
      if (!ctx) continue;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image with high quality scaling
      ctx.drawImage(img, 0, 0, scaledWidth, maxImageHeight);

      // Draw timestamp if enabled
      if (showTimestamps) {
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(frame.relativeTime, scaledWidth / 2, maxImageHeight + 40);
      }

      // Store canvas and collect image data
      frameCanvases.push(canvas);
      const imageData = ctx.getImageData(0, 0, scaledWidth, canvasHeight);
      allImageData.push(imageData.data);
    }

    if (frameCanvases.length === 0) throw new Error("This browser cannot draw on a 2D canvas.");

    // Create a global palette from all frames for consistent colors
    const combinedData = new Uint8ClampedArray(
      allImageData.reduce((acc, data) => acc + data.length, 0),
    );
    let offset = 0;
    for (const data of allImageData) {
      combinedData.set(data, offset);
      offset += data.length;
    }
    const globalPalette = quantize(combinedData, 256, { format: "rgb444" });

    // Process each frame with the global palette
    for (const canvas of frameCanvases) {
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      const imageData = ctx.getImageData(0, 0, scaledWidth, canvasHeight);
      const index = applyPalette(imageData.data, globalPalette);

      gif.writeFrame(index, scaledWidth, canvasHeight, {
        palette: globalPalette,
        delay: GIF_FRAME_DELAY_MS,
      });
    }

    // Finish encoding
    gif.finish();

    // Convert to proper Uint8Array for Blob
    const blob = new Blob([new Uint8Array(gif.bytes())], { type: "image/gif" });

    return {
      fileName: downloadBlob(blob, "gif"),
      format: "gif",
      frameCount: frameCanvases.length,
      width: scaledWidth,
      height: canvasHeight,
    };
  }
}

function loadImages(frames: readonly FilmStripFrame[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    frames.map(
      (frame) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () =>
            reject(new Error(`Could not load the frame at ${frame.relativeTime}.`));
          img.src = toDataUri(frame);
        }),
    ),
  );
}

/** Saves `blob` through a temporary link and returns the file name it used. */
function downloadBlob(blob: Blob, extension: FilmStripExportFormat): string {
  const fileName = `film-strip-${Date.now()}.${extension}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return fileName;
}
