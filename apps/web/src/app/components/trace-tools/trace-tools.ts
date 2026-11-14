import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { TraceService } from "../../services/trace.service";
import { FilmStripComponent } from "../film-strip/film-strip";
import { FlameChartComponent } from "../flame-chart/flame-chart";

/** What the app can make from a trace. */
export type TraceTool = "film-strip" | "flame-chart";

const TOOLS: readonly { id: TraceTool; label: string }[] = [
  { id: "film-strip", label: "Film strip" },
  { id: "flame-chart", label: "Flame chart" },
];

/** The tools for the loaded trace, one tab each. Only the selected tool is rendered. */
@Component({
  selector: "app-trace-tools",
  imports: [FilmStripComponent, FlameChartComponent],
  templateUrl: "./trace-tools.html",
  styleUrl: "./trace-tools.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceToolsComponent {
  private readonly traceService = inject(TraceService);

  protected readonly tools = TOOLS;
  protected readonly activeTool = signal<TraceTool>("film-strip");

  private readonly parsedTrace = this.traceService.currentParsedTrace;
  protected readonly screenshots = computed(() => this.parsedTrace()?.screenshots ?? []);
  protected readonly traceStartTime = computed(() => this.parsedTrace()?.metadata.startTime ?? 0);
  protected readonly traceEndTime = computed(() => this.parsedTrace()?.metadata.endTime ?? 0);

  protected onSelectTool(tool: TraceTool): void {
    this.activeTool.set(tool);
  }

  /** Arrow keys, Home and End move between the tabs, as the tabs pattern expects. */
  protected onTabKeydown(event: KeyboardEvent): void {
    const current = TOOLS.findIndex((tool) => tool.id === this.activeTool());
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % TOOLS.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + TOOLS.length) % TOOLS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = TOOLS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.activeTool.set(TOOLS[next].id);
    const tabs = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[next]?.focus();
  }
}
