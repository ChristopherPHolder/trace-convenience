import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraceParserService, Screenshot } from '../../services/trace-parser.service';

@Component({
  selector: 'app-film-strip',
  imports: [CommonModule],
  templateUrl: './film-strip.html',
  styleUrl: './film-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmStripComponent {
  private readonly traceParser = inject(TraceParserService);

  // Input properties
  readonly screenshots = input.required<Screenshot[]>();
  readonly startTime = input<number>(0);
  readonly endTime = input<number>(0);

  // State
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly isFullscreen = signal(false);
  protected readonly useIntervalFiltering = signal<boolean>(false);
  protected readonly minIntervalMs = signal<number>(100); // Default interval when enabled

  // Range slider configuration
  protected readonly minInterval = 10; // 10ms minimum
  protected readonly maxInterval = 2000; // 2s maximum
  protected readonly intervalStep = 10; // 10ms steps

  // Computed properties
  protected readonly hasScreenshots = computed(() => this.screenshots().length > 0);
  
  protected readonly filteredScreenshots = computed(() => {
    const shots = this.screenshots();
    const intervalMs = this.minIntervalMs();
    const useFiltering = this.useIntervalFiltering();
    
    if (!useFiltering || shots.length === 0) {
      return shots;
    }
    
    if (shots.length === 1) {
      return shots;
    }
    
    interface ScreenshotWithSyntheticTime extends Screenshot {
      syntheticTimestamp?: number;
    }
    
    const filtered: ScreenshotWithSyntheticTime[] = [];
    const startTime = shots[0].timestamp;
    const endTime = shots[shots.length - 1].timestamp;
    const durationMs = (endTime - startTime) / 1000; // Convert to milliseconds
    
    let shotIndex = 0;
    let currentTime = 0; // milliseconds from start
    
    // Generate screenshots at regular intervals
    while (currentTime <= durationMs) {
      const syntheticTimestamp = startTime + (currentTime * 1000); // Convert back to microseconds
      
      // Find the most recent screenshot at or before this time
      while (shotIndex < shots.length - 1 && shots[shotIndex + 1].timestamp <= syntheticTimestamp) {
        shotIndex++;
      }
      
      // Add the screenshot with a synthetic timestamp for display
      filtered.push({
        ...shots[shotIndex],
        syntheticTimestamp,
      });
      
      currentTime += intervalMs;
    }
    
    // Always ensure the last screenshot is included if not already
    const lastFiltered = filtered[filtered.length - 1];
    if (lastFiltered && lastFiltered.syntheticTimestamp !== endTime) {
      filtered.push({
        ...shots[shots.length - 1],
        syntheticTimestamp: endTime,
      });
    }
    
    return filtered;
  });
  
  protected readonly screenshotsWithMetadata = computed(() => {
    const shots = this.filteredScreenshots();
    const base = this.startTime();
    
    return shots.map((screenshot, index) => {
      // Use synthetic timestamp if available (when interval filtering is active), otherwise use original
      const displayTimestamp = (screenshot as any).syntheticTimestamp ?? screenshot.timestamp;
      const prevDisplayTimestamp = index > 0 
        ? ((shots[index - 1] as any).syntheticTimestamp ?? shots[index - 1].timestamp)
        : displayTimestamp;
      
      return {
        ...screenshot,
        index,
        relativeTime: this.traceParser.formatTimestamp(displayTimestamp, base),
        dataUri: this.traceParser.getDataUri(screenshot),
        delta: index > 0 
          ? (displayTimestamp - prevDisplayTimestamp) / 1000 // Convert to milliseconds
          : 0,
      };
    });
  });

  protected readonly selectedScreenshot = computed(() => {
    const index = this.selectedIndex();
    if (index === null) return null;
    return this.screenshotsWithMetadata()[index] || null;
  });

  protected readonly totalDuration = computed(() => {
    const start = this.startTime();
    const end = this.endTime();
    return this.traceParser.formatTimestamp(end, start);
  });

  protected readonly displayedCount = computed(() => this.filteredScreenshots().length);
  
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
    this.isFullscreen.update(current => !current);
  }

  protected onNavigatePrevious(): void {
    const current = this.selectedIndex();
    if (current !== null && current > 0) {
      this.selectedIndex.set(current - 1);
    }
  }

  protected onNavigateNext(): void {
    const current = this.selectedIndex();
    const max = this.filteredScreenshots().length - 1;
    if (current !== null && current < max) {
      this.selectedIndex.set(current + 1);
    }
  }

  protected onToggleFiltering(): void {
    this.useIntervalFiltering.update(current => !current);
    // Reset selection when toggling filtering
    this.selectedIndex.set(null);
  }

  protected onIntervalChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    this.minIntervalMs.set(value);
    // Reset selection when interval changes
    this.selectedIndex.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.selectedIndex() === null) return;

    switch (event.key) {
      case 'Escape':
        this.onClosePreview();
        break;
      case 'ArrowLeft':
        this.onNavigatePrevious();
        break;
      case 'ArrowRight':
        this.onNavigateNext();
        break;
      case 'f':
      case 'F':
        this.onToggleFullscreen();
        break;
    }
  }

  protected trackByIndex(index: number): number {
    return index;
  }
}

