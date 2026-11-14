import { Injectable, computed, inject } from "@angular/core";
import {
  screenshotSpanMs,
  selectFilmStripFrames,
  type FilmStripFrame,
  type Screenshot,
} from "@trace-convenience/trace-core";
import { FilmStripSettingsService } from "./film-strip-settings.service";
import { TraceService } from "./trace.service";

/**
 * The film strip of the loaded trace: which frames the current settings select.
 * The strip component and the WebMCP tools both read it, so they always agree.
 */
@Injectable({
  providedIn: "root",
})
export class FilmStripService {
  private readonly traceService = inject(TraceService);
  private readonly settingsService = inject(FilmStripSettingsService);

  /** Every screenshot of the loaded trace. Empty when no trace is loaded. */
  readonly screenshots = computed(() => this.traceService.currentParsedTrace()?.screenshots ?? []);

  /** Time between the first and last screenshot, in ms. */
  readonly totalDurationMs = computed(() => screenshotSpanMs(this.screenshots()));

  /** The frames the current settings select from the loaded trace. */
  readonly frames = computed(() => this.selectFrames(this.screenshots()));

  /**
   * Applies the time-range and interval settings to `screenshots`. It reads the
   * settings signals, so a `computed` that calls it follows the settings.
   */
  selectFrames(screenshots: readonly Screenshot[], baseTimestamp?: number): FilmStripFrame[] {
    const settings = this.settingsService;
    return selectFilmStripFrames(screenshots, {
      timeRange: settings.useTimeRangeFilter()
        ? { startMs: settings.startTimeMs(), endMs: settings.endTimeMs() }
        : undefined,
      intervalMs: settings.useIntervalFiltering() ? settings.minIntervalMs() : undefined,
      baseTimestamp,
    });
  }
}
