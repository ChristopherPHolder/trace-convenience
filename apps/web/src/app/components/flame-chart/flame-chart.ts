import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { FLAME_CHART_STYLE, formatDuration } from "@trace-convenience/trace-core";
import { PbBadge, PbButton, PbDescription, PbNotice, PbSwitch } from "../../design-system";
import {
  FlameChartExportService,
  type FlameChartExportFormat,
} from "../../services/flame-chart-export.service";
import { FlameChartService } from "../../services/flame-chart.service";

/** What a drag on the overview changes: a new range, the whole range, or one of its edges. */
type DragMode = "new" | "move" | "start" | "end";

interface Drag {
  mode: DragMode;
  /** Where the pointer went down, in px and in ms from the start of the trace. */
  anchorX: number;
  anchorMs: number;
  /** The range when the drag began. */
  startMs: number;
  endMs: number;
}

/** A press has to travel this far, in px, before it starts a new range. */
const DRAG_THRESHOLD = 3;

/** An arrow key moves an edge by this share of the trace; with Shift, ten times as far. */
const KEY_STEP = 1 / 200;

@Component({
  selector: "app-flame-chart",
  imports: [PbBadge, PbButton, PbDescription, PbNotice, PbSwitch],
  templateUrl: "./flame-chart.html",
  styleUrl: "./flame-chart.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlameChartComponent {
  private readonly flameChart = inject(FlameChartService);
  private readonly exportService = inject(FlameChartExportService);

  private readonly overviewElement = viewChild<ElementRef<HTMLElement>>("overviewElement");
  private drag: Drag | null = null;

  protected readonly style = FLAME_CHART_STYLE;
  protected readonly hasEntries = this.flameChart.hasEntries;
  protected readonly layout = this.flameChart.layout;
  protected readonly overview = this.flameChart.overview;
  protected readonly timeRange = this.flameChart.timeRange;
  protected readonly durationMs = this.flameChart.durationMs;
  protected readonly isWholeTrace = this.flameChart.isWholeTrace;
  protected readonly showDurations = this.flameChart.showDurations;

  protected readonly exporting = signal<FlameChartExportFormat | null>(null);
  protected readonly exportError = signal<string | null>(null);

  /** Bars wide enough to carry text. */
  protected readonly labelledBars = computed(
    () => this.layout()?.bars.filter((bar) => bar.label !== "") ?? [],
  );

  /** One path for every grid line and the rule under the axis. */
  protected readonly gridPath = computed(() => {
    const layout = this.layout();
    if (!layout) return "";
    const lines = layout.ticks.map((tick) => `M${tick.x} 0V${layout.height}`).join("");
    return `${lines}M0 ${layout.axisHeight - 0.5}H${layout.width}`;
  });

  /** The range as a share of the trace, for placing the selection on the overview. */
  protected readonly selection = computed(() => {
    const durationMs = this.durationMs();
    const { startMs, endMs } = this.timeRange();
    if (durationMs <= 0) return { left: 0, width: 100, right: 100 };
    const left = (startMs / durationMs) * 100;
    const right = (endMs / durationMs) * 100;
    return { left, width: right - left, right };
  });

  protected readonly rangeDuration = computed(() => {
    const { startMs, endMs } = this.timeRange();
    return formatDuration((endMs - startMs) * 1000);
  });

  protected readonly traceDuration = computed(() => formatDuration(this.durationMs() * 1000));

  protected readonly chartLabel = computed(() => {
    const { startMs, endMs } = this.timeRange();
    return `Flame chart of the main thread, from ${formatMs(startMs)} ms to ${formatMs(endMs)} ms`;
  });

  protected formatMs(value: number): string {
    return formatMs(value);
  }

  protected onStartInput(event: Event): void {
    const value = numberOf(event);
    if (value === null) return;
    const { endMs } = this.timeRange();
    this.flameChart.setTimeRange({ startMs: Math.min(value, endMs), endMs });
  }

  protected onEndInput(event: Event): void {
    const value = numberOf(event);
    if (value === null) return;
    const { startMs } = this.timeRange();
    this.flameChart.setTimeRange({ startMs, endMs: Math.max(value, startMs) });
  }

  protected onResetRange(): void {
    this.flameChart.resetTimeRange();
  }

  protected onSnapToTasks(): void {
    this.flameChart.snapToTasks();
  }

  protected onToggleDurations(value: boolean): void {
    this.flameChart.setShowDurations(value);
  }

  /** Cuts the chart to the bar that was double-clicked. */
  protected onCutToBar(event: Event): void {
    const index = (event.target as Element).getAttribute("data-entry");
    if (index !== null) this.flameChart.cutToEntry(Number(index));
  }

  protected onDragStart(event: PointerEvent, mode: DragMode): void {
    const overview = this.overviewElement()?.nativeElement;
    if (!overview || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    // Keeps the drag alive when the pointer leaves the overview.
    overview.setPointerCapture(event.pointerId);
    this.drag = {
      mode,
      anchorX: event.clientX,
      anchorMs: this.timeAt(event, overview),
      ...this.timeRange(),
    };
  }

  protected onDragMove(event: PointerEvent): void {
    const overview = this.overviewElement()?.nativeElement;
    const drag = this.drag;
    if (!overview || !drag) return;

    const atMs = this.timeAt(event, overview);
    switch (drag.mode) {
      case "new":
        if (Math.abs(event.clientX - drag.anchorX) < DRAG_THRESHOLD) return;
        this.flameChart.setTimeRange({
          startMs: Math.min(drag.anchorMs, atMs),
          endMs: Math.max(drag.anchorMs, atMs),
        });
        break;
      case "move": {
        const span = drag.endMs - drag.startMs;
        const startMs = clamp(drag.startMs + atMs - drag.anchorMs, 0, this.durationMs() - span);
        this.flameChart.setTimeRange({ startMs, endMs: startMs + span });
        break;
      }
      case "start":
        this.flameChart.setTimeRange({ startMs: Math.min(atMs, drag.endMs), endMs: drag.endMs });
        break;
      case "end":
        this.flameChart.setTimeRange({
          startMs: drag.startMs,
          endMs: Math.max(atMs, drag.startMs),
        });
        break;
    }
  }

  protected onDragEnd(): void {
    this.drag = null;
  }

  /** Moves one edge of the range with the arrow keys, Home and End. */
  protected onHandleKeydown(event: KeyboardEvent, edge: "start" | "end"): void {
    const durationMs = this.durationMs();
    const step = durationMs * KEY_STEP * (event.shiftKey ? 10 : 1);
    const { startMs, endMs } = this.timeRange();
    const current = edge === "start" ? startMs : endMs;

    let next: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = current - step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = current + step;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = durationMs;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.flameChart.setTimeRange(
      edge === "start"
        ? { startMs: Math.min(next, endMs), endMs }
        : { startMs, endMs: Math.max(next, startMs) },
    );
  }

  protected async onDownload(format: FlameChartExportFormat): Promise<void> {
    const layout = this.layout();
    if (!layout || this.exporting()) return;

    this.exporting.set(format);
    this.exportError.set(null);
    try {
      await this.exportService.download(format, layout);
    } catch (error) {
      console.error(`Failed to download the flame chart as ${format}:`, error);
      this.exportError.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.exporting.set(null);
    }
  }

  /** The trace time under the pointer, in ms from the start of the trace. */
  private timeAt(event: PointerEvent, overview: HTMLElement): number {
    const box = overview.getBoundingClientRect();
    if (box.width <= 0) return 0;
    return clamp((event.clientX - box.left) / box.width, 0, 1) * this.durationMs();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function formatMs(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** The number typed into an input, or `null` when it is not one. */
function numberOf(event: Event): number | null {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  return Number.isFinite(value) ? value : null;
}
