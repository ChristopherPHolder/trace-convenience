import { Injectable, computed, inject, linkedSignal, signal } from "@angular/core";
import {
  clampTimeRange,
  flameChartDurationMs,
  layoutFlameChart,
  parseFlameChart,
  snapTimeRangeToTasks,
  type FlameChart,
  type FlameChartLayout,
  type TimeRange,
} from "@trace-convenience/trace-core";
import { TraceService } from "./trace.service";

/** Width of the chart in px. Fixed, so an export does not depend on the window's size. */
export const FLAME_CHART_WIDTH = 1200;

/** The shortest range the chart can be cut to, in ms. */
const MIN_RANGE_MS = 0.1;

/** The overview shows this many nesting levels of the whole trace, 4 px each. */
const OVERVIEW_ROW_HEIGHT = 4;
const OVERVIEW_MAX_DEPTH = 15;

/**
 * The flame chart of the loaded trace: the main thread's activity, the time
 * range it is cut to and where each bar goes. The chart component and the
 * export both read it, so the download is what the page shows.
 */
@Injectable({
  providedIn: "root",
})
export class FlameChartService {
  private readonly traceService = inject(TraceService);

  /** The main thread's activity. `null` when no trace is loaded or it cannot be read. */
  readonly chart = computed<FlameChart | null>(() => {
    const file = this.traceService.currentFile();
    if (!file) return null;
    try {
      return parseFlameChart(file.content);
    } catch (error) {
      console.warn("Failed to read the main thread from the trace:", error);
      return null;
    }
  });

  readonly hasEntries = computed(() => (this.chart()?.entries.length ?? 0) > 0);

  /** Length of the trace, in ms. */
  readonly durationMs = computed(() => {
    const chart = this.chart();
    return chart ? flameChartDurationMs(chart) : 0;
  });

  // Starts over with the whole trace whenever another trace is loaded.
  private readonly range = linkedSignal<FlameChart | null, TimeRange>({
    source: this.chart,
    computation: (chart) => ({ startMs: 0, endMs: chart ? flameChartDurationMs(chart) : 0 }),
  });

  /** The part of the trace the chart is cut to, in ms from its start. */
  readonly timeRange = this.range.asReadonly();

  readonly isWholeTrace = computed(() => {
    const { startMs, endMs } = this.range();
    return startMs <= 0 && endMs >= this.durationMs();
  });

  private readonly _showDurations = signal(true);

  /** Whether each bar shows its duration after its name. */
  readonly showDurations = this._showDurations.asReadonly();

  /** Where each bar of the cut chart goes. */
  readonly layout = computed<FlameChartLayout | null>(() => {
    const chart = this.chart();
    if (!chart) return null;
    return layoutFlameChart(chart, {
      timeRange: this.range(),
      width: FLAME_CHART_WIDTH,
      showDurations: this._showDurations(),
    });
  });

  /** The whole trace in miniature, for choosing the range on. */
  readonly overview = computed<FlameChartLayout | null>(() => {
    const chart = this.chart();
    if (!chart) return null;
    return layoutFlameChart(chart, {
      width: FLAME_CHART_WIDTH,
      rowHeight: OVERVIEW_ROW_HEIGHT,
      maxDepth: OVERVIEW_MAX_DEPTH,
      showAxis: false,
      showLabels: false,
    });
  });

  /** Cuts the chart to `timeRange`, kept inside the trace and at least 0.1 ms long. */
  setTimeRange(timeRange: TimeRange): void {
    const chart = this.chart();
    if (!chart) return;

    const durationMs = this.durationMs();
    const minSpan = Math.min(MIN_RANGE_MS, durationMs);
    let { startMs, endMs } = clampTimeRange(chart, timeRange);
    if (endMs - startMs < minSpan) {
      endMs = Math.min(startMs + minSpan, durationMs);
      startMs = endMs - minSpan;
    }
    this.range.set({ startMs, endMs });
  }

  /** Shows the whole trace again. */
  resetTimeRange(): void {
    this.range.set({ startMs: 0, endMs: this.durationMs() });
  }

  /** Widens the range to whole tasks, so that none is cut off at an edge. */
  snapToTasks(): void {
    const chart = this.chart();
    if (chart) this.setTimeRange(snapTimeRangeToTasks(chart, this.range()));
  }

  /** Cuts the chart to one entry, by its index in `chart().entries`. */
  cutToEntry(entryIndex: number): void {
    const chart = this.chart();
    const entry = chart?.entries[entryIndex];
    if (!chart || !entry) return;
    this.setTimeRange({
      startMs: (entry.start - chart.startTime) / 1000,
      endMs: (entry.start + entry.duration - chart.startTime) / 1000,
    });
  }

  setShowDurations(value: boolean): void {
    this._showDurations.set(value);
  }
}
