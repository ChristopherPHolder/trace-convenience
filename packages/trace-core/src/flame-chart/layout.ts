import type { TimeRange } from "../film-strip";
import { formatDuration } from "./format";
import { flameChartDurationMs } from "./parse-flame-chart";
import { FLAME_CHART_STYLE } from "./style";
import { measureText, truncateText } from "./text-width";
import type { FlameChart, FlameChartEntry } from "./types";

export interface FlameChartLayoutOptions {
  /** The part of the trace to show, in ms from its start. Defaults to all of it. */
  timeRange?: TimeRange;
  /** Width of the chart in px. Defaults to 1200. */
  width?: number;
  /** Height of one nesting level in px. Defaults to 17, as in DevTools. */
  rowHeight?: number;
  /** Draw the time axis above the bars. Defaults to true. */
  showAxis?: boolean;
  /** Write each entry's name on its bar. Defaults to true. */
  showLabels?: boolean;
  /** Write each entry's duration after its name, where there is room. Defaults to true. */
  showDurations?: boolean;
  /** Leave out entries nested deeper than this level. */
  maxDepth?: number;
}

/** A rectangle in px. The origin is the chart's top left corner. */
export interface FlameChartRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlameChartBar extends FlameChartRect {
  /** Index of the entry in `FlameChart.entries`. */
  entryIndex: number;
  color: string;
  /** The entry's name, cut to fit the bar. Empty when the bar is too narrow for text. */
  label: string;
  /** The entry's duration, written after the label. Empty when it does not fit. */
  detail: string;
  /** The entry's name, duration and self time, for a tooltip. */
  title: string;
}

export interface FlameChartTick {
  x: number;
  /** Time since the start of the range, such as `250 ms`. */
  label: string;
}

/** Where everything in a flame chart goes. Draw it with `renderFlameChartSvg`. */
export interface FlameChartLayout {
  width: number;
  height: number;
  /** Height of the time axis. 0 when the chart has none. */
  axisHeight: number;
  fontSize: number;
  /** The range the chart shows, in ms from the start of the trace. */
  timeRange: TimeRange;
  ticks: FlameChartTick[];
  bars: FlameChartBar[];
  /** The part of each long task past 50 ms, which DevTools hatches in red. */
  longTaskOverruns: FlameChartRect[];
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_ROW_HEIGHT = 17;
const AXIS_HEIGHT = 22;
const FONT_SIZE = FLAME_CHART_STYLE.fontSize;
/** Space between the edge of a bar and its text, and between the name and the duration. */
const TEXT_PADDING = FLAME_CHART_STYLE.textPadding;
/** Bars leave this much of their slot empty, so neighbours do not run together. */
const BAR_GAP = 0.5;
const MIN_BAR_WIDTH = 1;
/** A bar narrower than this has no room for a character and an ellipsis. */
const MIN_LABEL_WIDTH = 2 * TEXT_PADDING + FONT_SIZE;
/** A task that blocks the main thread for longer than this is a long task. */
const LONG_TASK_MICROSECONDS = 50_000;
/** Aim for a tick about this often, in px. */
const TICK_SPACING = 100;

/**
 * Lays out the entries of a flame chart that fall in a time range. An entry
 * that crosses an edge of the range is cut off there.
 */
export function layoutFlameChart(
  chart: FlameChart,
  options: FlameChartLayoutOptions = {},
): FlameChartLayout {
  const width = options.width ?? DEFAULT_WIDTH;
  const rowHeight = options.rowHeight ?? DEFAULT_ROW_HEIGHT;
  const axisHeight = (options.showAxis ?? true) ? AXIS_HEIGHT : 0;
  const showLabels = options.showLabels ?? true;
  const showDurations = options.showDurations ?? true;
  const maxDepth = options.maxDepth ?? Infinity;

  const timeRange = clampTimeRange(chart, options.timeRange);
  const rangeStart = chart.startTime + timeRange.startMs * 1000;
  const rangeEnd = chart.startTime + timeRange.endMs * 1000;
  const pxPerMicrosecond = rangeEnd > rangeStart ? width / (rangeEnd - rangeStart) : 0;
  const toX = (time: number): number =>
    Math.min(Math.max((time - rangeStart) * pxPerMicrosecond, 0), width);

  const bars: FlameChartBar[] = [];
  const longTaskOverruns: FlameChartRect[] = [];
  /** Per row, the pixel column of the last sliver drawn. One per column is all the eye can see. */
  const lastSliverColumn: number[] = [];
  let deepest = -1;

  for (let entryIndex = 0; entryIndex < chart.entries.length; entryIndex++) {
    const entry = chart.entries[entryIndex];
    if (entry.start >= rangeEnd) break;
    const end = entry.start + entry.duration;
    if (end <= rangeStart || entry.depth > maxDepth) continue;

    const left = toX(entry.start);
    const slot = Math.max(toX(end) - left, MIN_BAR_WIDTH);
    const x = Math.min(left, width - slot);
    if (slot <= MIN_BAR_WIDTH) {
      const column = Math.floor(x);
      if (lastSliverColumn[entry.depth] === column) continue;
      lastSliverColumn[entry.depth] = column;
    }

    const y = axisHeight + entry.depth * rowHeight;
    const barWidth = slot - BAR_GAP;
    const barHeight = Math.max(rowHeight - 1, 1);
    const text = showLabels ? labelFor(entry, barWidth, showDurations) : NO_LABEL;
    bars.push({
      entryIndex,
      x: round(x),
      y,
      width: round(barWidth),
      height: barHeight,
      color: entry.color,
      label: text.label,
      detail: text.detail,
      title: titleFor(entry),
    });
    deepest = Math.max(deepest, entry.depth);

    if (isLongTask(entry)) {
      const overrunLeft = Math.max(toX(entry.start + LONG_TASK_MICROSECONDS), x);
      const overrunWidth = x + barWidth - overrunLeft;
      if (overrunWidth > 0) {
        longTaskOverruns.push({
          x: round(overrunLeft),
          y,
          width: round(overrunWidth),
          height: barHeight,
        });
      }
    }
  }

  return {
    width,
    height: axisHeight + Math.max(deepest + 1, 1) * rowHeight,
    axisHeight,
    fontSize: FONT_SIZE,
    timeRange,
    ticks: axisHeight > 0 ? ticksFor(timeRange.endMs - timeRange.startMs, width) : [],
    bars,
    longTaskOverruns,
  };
}

/**
 * Widens a time range so that it covers every top-level task it touches and
 * nothing else: it starts where the first one starts and ends where the last
 * one ends. A range that touches no task is returned as it is.
 */
export function snapTimeRangeToTasks(chart: FlameChart, timeRange: TimeRange): TimeRange {
  const rangeStart = chart.startTime + timeRange.startMs * 1000;
  const rangeEnd = chart.startTime + timeRange.endMs * 1000;
  let first = Infinity;
  let last = -Infinity;

  for (const entry of chart.entries) {
    if (entry.start >= rangeEnd) break;
    if (entry.depth !== 0) continue;
    const end = entry.start + entry.duration;
    if (end <= rangeStart) continue;
    first = Math.min(first, entry.start);
    last = Math.max(last, end);
  }

  if (last <= first) return timeRange;
  return {
    startMs: (first - chart.startTime) / 1000,
    endMs: (last - chart.startTime) / 1000,
  };
}

/** Keeps a time range inside the trace and in order. */
export function clampTimeRange(chart: FlameChart, timeRange?: TimeRange): TimeRange {
  const durationMs = flameChartDurationMs(chart);
  if (!timeRange) return { startMs: 0, endMs: durationMs };
  const startMs = Math.min(Math.max(finiteOr(timeRange.startMs, 0), 0), durationMs);
  const endMs = Math.min(Math.max(finiteOr(timeRange.endMs, durationMs), startMs), durationMs);
  return { startMs, endMs };
}

const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const round = (value: number): number => Math.round(value * 100) / 100;

const NO_LABEL = { label: "", detail: "" } as const;

function labelFor(
  entry: FlameChartEntry,
  barWidth: number,
  showDurations: boolean,
): { label: string; detail: string } {
  if (barWidth < MIN_LABEL_WIDTH) return NO_LABEL;
  const room = barWidth - 2 * TEXT_PADDING;

  if (showDurations) {
    const detail = formatDuration(entry.duration);
    const needed =
      measureText(entry.name, FONT_SIZE) + TEXT_PADDING + measureText(detail, FONT_SIZE);
    if (needed <= room) return { label: entry.name, detail };
  }
  return { label: truncateText(entry.name, room, FONT_SIZE), detail: "" };
}

function titleFor(entry: FlameChartEntry): string {
  const duration = formatDuration(entry.duration);
  const self = formatDuration(Math.max(entry.selfTime, 0));
  const source = entry.url ? `\n${entry.url}` : "";
  return `${entry.name}\n${duration} (self ${self})${source}`;
}

function isLongTask(entry: FlameChartEntry): boolean {
  return (
    entry.depth === 0 &&
    entry.kind === "event" &&
    entry.name === "Task" &&
    entry.duration > LONG_TASK_MICROSECONDS
  );
}

/** Ticks at round intervals, labelled with the time since the start of the range. */
function ticksFor(spanMs: number, width: number): FlameChartTick[] {
  if (spanMs <= 0) return [];
  const stepMs = roundStep((spanMs * TICK_SPACING) / width);
  const inSeconds = stepMs >= 1000;
  const unitStep = inSeconds ? stepMs / 1000 : stepMs;
  const decimals = Math.max(0, -Math.floor(Math.log10(unitStep)));

  const ticks: FlameChartTick[] = [];
  for (let i = 0; i * stepMs < spanMs; i++) {
    const x = round(((i * stepMs) / spanMs) * width);
    const label = `${(i * unitStep).toFixed(decimals)} ${inSeconds ? "s" : "ms"}`;
    // A tick too close to the right edge would have its label cut off.
    if (x + FLAME_CHART_STYLE.tickLabelOffset + measureText(label, FONT_SIZE) > width) break;
    ticks.push({ x, label });
  }
  return ticks;
}

/** The smallest of 1, 2 and 5 times a power of ten that is at least `value`. */
function roundStep(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((factor) => factor * magnitude >= value) ?? 10;
  return step * magnitude;
}
