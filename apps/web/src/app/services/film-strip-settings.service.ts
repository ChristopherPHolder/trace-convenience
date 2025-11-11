import { Injectable, signal } from '@angular/core';

export interface FilmStripSettings {
  exportImageHeight: number;
  exportPadding: number;
  exportShowTimestamps: boolean;
  useIntervalFiltering: boolean;
  minIntervalMs: number;
  useTimeRangeFilter: boolean;
  startTimeMs: number;
  endTimeMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class FilmStripSettingsService {
  // Settings state
  private readonly _exportImageHeight = signal<number>(200);
  private readonly _exportPadding = signal<number>(10);
  private readonly _exportShowTimestamps = signal<boolean>(true);
  private readonly _useIntervalFiltering = signal<boolean>(false);
  private readonly _minIntervalMs = signal<number>(100);
  private readonly _useTimeRangeFilter = signal<boolean>(false);
  private readonly _startTimeMs = signal<number>(0);
  private readonly _endTimeMs = signal<number>(0);
  private readonly _maxTimeMs = signal<number>(0);
  private readonly _isOpen = signal<boolean>(false);

  // Public readonly signals
  readonly exportImageHeight = this._exportImageHeight.asReadonly();
  readonly exportPadding = this._exportPadding.asReadonly();
  readonly exportShowTimestamps = this._exportShowTimestamps.asReadonly();
  readonly useIntervalFiltering = this._useIntervalFiltering.asReadonly();
  readonly minIntervalMs = this._minIntervalMs.asReadonly();
  readonly useTimeRangeFilter = this._useTimeRangeFilter.asReadonly();
  readonly startTimeMs = this._startTimeMs.asReadonly();
  readonly endTimeMs = this._endTimeMs.asReadonly();
  readonly maxTimeMs = this._maxTimeMs.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();

  // Methods to update settings
  setExportImageHeight(value: number): void {
    this._exportImageHeight.set(value);
  }

  setExportPadding(value: number): void {
    this._exportPadding.set(value);
  }

  setExportShowTimestamps(value: boolean): void {
    this._exportShowTimestamps.set(value);
  }

  setUseIntervalFiltering(value: boolean): void {
    this._useIntervalFiltering.set(value);
  }

  setMinIntervalMs(value: number): void {
    this._minIntervalMs.set(value);
  }

  setUseTimeRangeFilter(value: boolean): void {
    this._useTimeRangeFilter.set(value);
  }

  setStartTimeMs(value: number): void {
    this._startTimeMs.set(value);
  }

  setEndTimeMs(value: number): void {
    this._endTimeMs.set(value);
  }

  setMaxTimeMs(value: number): void {
    this._maxTimeMs.set(value);
    // Initialize end time to max time if it's not set or exceeds max
    if (this._endTimeMs() === 0 || this._endTimeMs() > value) {
      this._endTimeMs.set(value);
    }
  }

  // Methods to control dialog visibility
  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update(current => !current);
  }

  // Get all settings at once
  getSettings(): FilmStripSettings {
    return {
      exportImageHeight: this._exportImageHeight(),
      exportPadding: this._exportPadding(),
      exportShowTimestamps: this._exportShowTimestamps(),
      useIntervalFiltering: this._useIntervalFiltering(),
      minIntervalMs: this._minIntervalMs(),
      useTimeRangeFilter: this._useTimeRangeFilter(),
      startTimeMs: this._startTimeMs(),
      endTimeMs: this._endTimeMs(),
    };
  }
}

