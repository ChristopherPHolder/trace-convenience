import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
  effect,
} from "@angular/core";
import {
  formatTimestamp,
  screenshotSpanMs,
  toDataUri,
  type Screenshot,
} from "@trace-convenience/trace-core";
import { FilmStripExportService } from "../../services/film-strip-export.service";
import { FilmStripSettingsService } from "../../services/film-strip-settings.service";
import { FilmStripService } from "../../services/film-strip.service";
import { PbBadge, PbButton, PbDescription, PbIconButton } from "../../design-system";

@Component({
  selector: "app-film-strip",
  imports: [PbBadge, PbButton, PbDescription, PbIconButton],
  templateUrl: "./film-strip.html",
  styleUrl: "./film-strip.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmStripComponent {
  private readonly settingsService = inject(FilmStripSettingsService);
  private readonly filmStripService = inject(FilmStripService);
  private readonly exportService = inject(FilmStripExportService);

  // Input properties
  readonly screenshots = input.required<Screenshot[]>();
  readonly startTime = input<number>(0);
  readonly endTime = input<number>(0);

  // State
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly isFullscreen = signal(false);
  protected readonly selectedFormat = signal<"png" | "gif">("png");
  protected readonly isFormatDropdownOpen = signal(false);

  // Get settings state from service
  protected readonly useIntervalFiltering = this.settingsService.useIntervalFiltering;
  protected readonly minIntervalMs = this.settingsService.minIntervalMs;
  protected readonly showTimestamps = this.settingsService.exportShowTimestamps;

  // Range slider configuration
  protected readonly minInterval = 10; // 10ms minimum
  protected readonly maxInterval = 2000; // 2s maximum
  protected readonly intervalStep = 10; // 10ms steps

  // Update max time when screenshots change
  constructor() {
    effect(() => {
      const durationMs = this.totalDurationMs();
      this.settingsService.setMaxTimeMs(durationMs);
    });
  }

  // Computed properties
  protected readonly hasScreenshots = computed(() => this.screenshots().length > 0);

  // Calculate the total duration in milliseconds
  protected readonly totalDurationMs = computed(() => screenshotSpanMs(this.screenshots()));

  // FilmStripService applies the time-range and interval settings.
  protected readonly screenshotsWithMetadata = computed(() =>
    this.filmStripService
      .selectFrames(this.screenshots(), this.startTime())
      .map((frame) => ({ ...frame, dataUri: toDataUri(frame) })),
  );

  protected readonly selectedScreenshot = computed(() => {
    const index = this.selectedIndex();
    if (index === null) return null;
    return this.screenshotsWithMetadata()[index] || null;
  });

  protected readonly totalDuration = computed(() => {
    const start = this.startTime();
    const end = this.endTime();
    return formatTimestamp(end, start);
  });

  protected readonly displayedCount = computed(() => this.screenshotsWithMetadata().length);

  protected readonly totalCount = computed(() => this.screenshots().length);

  protected readonly intervalLabel = computed(() => {
    const ms = this.minIntervalMs();
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  });

  // Event handlers
  protected onSelectScreenshot(index: number): void {
    this.selectedIndex.set(index);
  }

  protected onClosePreview(): void {
    this.selectedIndex.set(null);
  }

  protected onToggleFullscreen(): void {
    this.isFullscreen.update((current) => !current);
  }

  protected onNavigatePrevious(): void {
    const current = this.selectedIndex();
    if (current !== null && current > 0) {
      this.selectedIndex.set(current - 1);
    }
  }

  protected onNavigateNext(): void {
    const current = this.selectedIndex();
    const max = this.screenshotsWithMetadata().length - 1;
    if (current !== null && current < max) {
      this.selectedIndex.set(current + 1);
    }
  }

  protected onOpenAdvancedSettings(): void {
    this.settingsService.open();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.selectedIndex() === null) return;

    switch (event.key) {
      case "Escape":
        this.onClosePreview();
        break;
      case "ArrowLeft":
        this.onNavigatePrevious();
        break;
      case "ArrowRight":
        this.onNavigateNext();
        break;
      case "f":
      case "F":
        this.onToggleFullscreen();
        break;
    }
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected toggleFormatDropdown(): void {
    this.isFormatDropdownOpen.update((open) => !open);
  }

  protected closeFormatDropdown(): void {
    this.isFormatDropdownOpen.set(false);
  }

  protected selectFormat(format: "png" | "gif"): void {
    this.selectedFormat.set(format);
    this.closeFormatDropdown();
  }

  protected async onDownload(): Promise<void> {
    const frames = this.screenshotsWithMetadata();
    if (frames.length === 0) return;

    const format = this.selectedFormat();
    try {
      await this.exportService.download(format, frames);
    } catch (error) {
      console.error(`Failed to download the film strip as ${format}:`, error);
      if (format === "gif") {
        alert("Failed to create GIF. Please try PNG format instead.");
      }
    }
  }
}
