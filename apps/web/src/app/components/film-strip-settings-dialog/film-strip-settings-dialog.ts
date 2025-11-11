import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilmStripSettingsService } from '../../services/film-strip-settings.service';

@Component({
  selector: 'app-film-strip-settings-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './film-strip-settings-dialog.html',
  styleUrl: './film-strip-settings-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmStripSettingsDialogComponent {
  private readonly settingsService = inject(FilmStripSettingsService);

  // Expose service signals
  protected readonly isOpen = this.settingsService.isOpen;
  protected readonly exportShowTimestamps = this.settingsService.exportShowTimestamps;
  protected readonly useIntervalFiltering = this.settingsService.useIntervalFiltering;
  protected readonly minIntervalMs = this.settingsService.minIntervalMs;
  protected readonly useTimeRangeFilter = this.settingsService.useTimeRangeFilter;
  protected readonly startTimeMs = this.settingsService.startTimeMs;
  protected readonly endTimeMs = this.settingsService.endTimeMs;
  protected readonly maxTimeMs = this.settingsService.maxTimeMs;

  // Range slider configuration
  protected readonly minInterval = 10; // 10ms minimum
  protected readonly maxInterval = 2000; // 2s maximum
  protected readonly intervalStep = 10; // 10ms steps

  // Computed interval label
  protected readonly intervalLabel = computed(() => {
    const ms = this.minIntervalMs();
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  });

  // Event handlers
  protected onClose(): void {
    this.settingsService.close();
  }

  protected onExportShowTimestampsToggle(): void {
    this.settingsService.setExportShowTimestamps(!this.exportShowTimestamps());
  }

  protected onToggleFiltering(): void {
    this.settingsService.setUseIntervalFiltering(!this.useIntervalFiltering());
  }

  protected onIntervalChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    this.settingsService.setMinIntervalMs(value);
  }

  protected onToggleTimeRangeFilter(): void {
    this.settingsService.setUseTimeRangeFilter(!this.useTimeRangeFilter());
  }

  protected onStartTimeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (!isNaN(value) && value >= 0) {
      this.settingsService.setStartTimeMs(value);
    }
  }

  protected onEndTimeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (!isNaN(value) && value >= 0) {
      this.settingsService.setEndTimeMs(value);
    }
  }
}

