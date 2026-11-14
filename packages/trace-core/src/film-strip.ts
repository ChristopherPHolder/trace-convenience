import { formatTimestamp } from "./time";
import type { Screenshot } from "./types";

export interface TimeRange {
  /** Window start in ms, relative to the first screenshot. */
  startMs: number;
  /** Window end in ms, relative to the first screenshot. */
  endMs: number;
}

export interface FrameSelectionOptions {
  /** Restrict frames to this window (plus one context frame on each side). */
  timeRange?: TimeRange;
  /**
   * Re-sample the strip onto a fixed timeline, one frame every `intervalMs`,
   * each showing the most recent screenshot at that moment. Disabled when
   * omitted or <= 0.
   */
  intervalMs?: number;
  /**
   * Origin (µs) for `relativeTime` when no time range is set.
   * Defaults to the first screenshot's timestamp.
   */
  baseTimestamp?: number;
}

export interface FilmStripFrame extends Screenshot {
  index: number;
  /** Timeline position (µs) this frame stands for when interval sampling is on. */
  syntheticTimestamp?: number;
  /** Timestamp (µs) the frame is shown at: `syntheticTimestamp` if set, else `timestamp`. */
  displayTimestamp: number;
  /** Display time relative to the strip's origin, e.g. `"250ms"` or `"1.20s"`. */
  relativeTime: string;
  /** Milliseconds since the previous frame's display time (0 for the first frame). */
  delta: number;
}

type SampledScreenshot = Screenshot & { syntheticTimestamp?: number };

/** Time between the first and last screenshot, in ms. */
export function screenshotSpanMs(screenshots: readonly Screenshot[]): number {
  if (screenshots.length === 0) return 0;
  return (screenshots[screenshots.length - 1].timestamp - screenshots[0].timestamp) / 1000;
}

/**
 * Picks the frames of a film strip from timestamp-sorted screenshots,
 * applying the optional time window and interval sampling.
 */
export function selectFilmStripFrames(
  screenshots: readonly Screenshot[],
  options: FrameSelectionOptions = {},
): FilmStripFrame[] {
  if (screenshots.length === 0) return [];

  const origin = screenshots[0].timestamp;
  const window = options.timeRange
    ? {
        start: origin + options.timeRange.startMs * 1000,
        end: origin + options.timeRange.endMs * 1000,
      }
    : null;

  const inWindow = window
    ? filterToWindow(screenshots, window.start, window.end)
    : [...screenshots];
  const sampled: SampledScreenshot[] =
    options.intervalMs && options.intervalMs > 0
      ? sampleAtInterval(inWindow, options.intervalMs, window)
      : inWindow;

  const base = window?.start ?? options.baseTimestamp ?? origin;

  return sampled.map((shot, index) => {
    const displayTimestamp = shot.syntheticTimestamp ?? shot.timestamp;
    const previous = index > 0 ? sampled[index - 1] : null;
    const previousDisplay = previous
      ? (previous.syntheticTimestamp ?? previous.timestamp)
      : displayTimestamp;
    return {
      ...shot,
      index,
      displayTimestamp,
      relativeTime: formatTimestamp(displayTimestamp, base),
      delta: (displayTimestamp - previousDisplay) / 1000,
    };
  });
}

/**
 * Keeps screenshots inside [start, end] (µs), plus the last frame at or before
 * `start` and the first at or after `end`. Screenshots are discrete samples, so
 * these context frames show what was on screen at each boundary.
 */
function filterToWindow(shots: readonly Screenshot[], start: number, end: number): Screenshot[] {
  let startIndex = 0;
  for (let i = 0; i < shots.length; i++) {
    if (shots[i].timestamp <= start) startIndex = i;
    else break;
  }

  let endIndex = shots.length - 1;
  for (let i = 0; i < shots.length; i++) {
    if (shots[i].timestamp >= end) {
      endIndex = i;
      break;
    }
  }

  return shots.filter(
    (shot, index) =>
      (index === startIndex || shot.timestamp >= start) &&
      (index === endIndex || shot.timestamp <= end),
  );
}

/**
 * Re-samples screenshots onto a fixed timeline every `intervalMs`. With a
 * window, the timeline runs from window start to window end; otherwise from the
 * first to the last screenshot, with one extra step if the last screenshot
 * would otherwise be missed.
 */
function sampleAtInterval(
  shots: Screenshot[],
  intervalMs: number,
  window: { start: number; end: number } | null,
): SampledScreenshot[] {
  if (shots.length <= 1) return shots;

  const startTime = window?.start ?? shots[0].timestamp;
  const endTime = window?.end ?? shots[shots.length - 1].timestamp;
  const durationMs = (endTime - startTime) / 1000;

  const sampled: SampledScreenshot[] = [];
  let shotIndex = 0;
  let currentMs = 0;

  while (currentMs <= durationMs) {
    const syntheticTimestamp = startTime + currentMs * 1000;
    while (shotIndex < shots.length - 1 && shots[shotIndex + 1].timestamp <= syntheticTimestamp) {
      shotIndex++;
    }
    sampled.push({ ...shots[shotIndex], syntheticTimestamp });
    currentMs += intervalMs;
  }

  // Without a window the timeline ends on the last real frame, and interval
  // steps may not land on it. With a window the end is explicit, so never
  // append past it.
  if (!window) {
    const last = sampled[sampled.length - 1];
    if (
      last?.syntheticTimestamp !== undefined &&
      shots[shots.length - 1].timestamp > last.syntheticTimestamp
    ) {
      sampled.push({
        ...shots[shotIndex],
        syntheticTimestamp: startTime + currentMs * 1000,
      });
    }
  }

  return sampled;
}
