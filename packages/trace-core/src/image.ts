import type { ImageFormat, Screenshot } from "./types";

/** Strips a `data:image/...;base64,` prefix, returning the raw base64 payload. */
export function extractBase64FromDataUri(dataUri: string): string {
  if (dataUri.startsWith("data:image/")) {
    const commaIndex = dataUri.indexOf(",");
    if (commaIndex !== -1) {
      return dataUri.substring(commaIndex + 1);
    }
  }
  return dataUri;
}

/** Detects the image format from a data URI prefix or base64 magic bytes. Defaults to jpeg. */
export function detectImageFormat(data: string): ImageFormat {
  if (data.startsWith("data:image/png")) return "png";
  if (data.startsWith("data:image/jpeg") || data.startsWith("data:image/jpg")) return "jpeg";
  if (data.startsWith("iVBOR")) return "png";
  // JPEG base64 starts with /9j/; anything unrecognised also falls back to jpeg.
  return "jpeg";
}

export function mimeTypeOf(format: ImageFormat): "image/png" | "image/jpeg" {
  return format === "png" ? "image/png" : "image/jpeg";
}

export function toDataUri(screenshot: Screenshot): string {
  return `data:${mimeTypeOf(screenshot.format)};base64,${screenshot.data}`;
}
