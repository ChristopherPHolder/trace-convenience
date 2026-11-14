import { detectImageFormat, extractBase64FromDataUri } from "./image";
import type { ParsedTrace, Screenshot } from "./types";

interface TraceEvent {
  name?: string;
  cat?: string;
  ts?: number;
  args?: {
    snapshot?: string;
    dataUri?: string;
    data?: string;
  };
}

interface ChromeTrace {
  traceEvents?: unknown;
}

/**
 * Parses a Chrome DevTools trace (already JSON-decoded) and extracts its screenshots,
 * sorted by timestamp.
 *
 * Recognises `Screenshot` (devtools.screenshot category), `ScreencastFrame` and
 * `CaptureFrame` events.
 */
export function parseTrace(traceContent: unknown): ParsedTrace {
  if (!traceContent || typeof traceContent !== "object") {
    throw new Error("Invalid trace format");
  }

  const traceEvents = (traceContent as ChromeTrace).traceEvents ?? [];
  if (!Array.isArray(traceEvents)) {
    throw new Error("Trace events must be an array");
  }

  const screenshots: Screenshot[] = [];

  for (const event of traceEvents as TraceEvent[]) {
    if (!event || typeof event !== "object") continue;

    const timestamp = event.ts || 0;

    if (
      event.name === "Screenshot" &&
      event.cat?.includes("disabled-by-default-devtools.screenshot")
    ) {
      const snapshot = event.args?.snapshot;
      if (snapshot && typeof snapshot === "string") {
        screenshots.push({
          timestamp,
          data: snapshot,
          format: detectImageFormat(snapshot),
        });
      }
    }

    if (event.name === "ScreencastFrame" || event.name === "screencastFrame") {
      const data = event.args?.dataUri || event.args?.data;
      if (data && typeof data === "string") {
        const imageData = extractBase64FromDataUri(data);
        screenshots.push({
          timestamp,
          data: imageData,
          format: detectImageFormat(imageData),
        });
      }
    }

    if (event.name === "CaptureFrame") {
      const data = event.args?.data;
      if (data && typeof data === "string") {
        screenshots.push({
          timestamp,
          data: extractBase64FromDataUri(data),
          format: detectImageFormat(data),
        });
      }
    }
  }

  screenshots.sort((a, b) => a.timestamp - b.timestamp);

  const startTime = screenshots.length > 0 ? screenshots[0].timestamp : 0;
  const endTime = screenshots.length > 0 ? screenshots[screenshots.length - 1].timestamp : 0;

  return {
    screenshots,
    metadata: {
      startTime,
      endTime,
      duration: endTime - startTime,
      screenshotCount: screenshots.length,
    },
  };
}
