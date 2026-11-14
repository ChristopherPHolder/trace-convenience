import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  formatTimestamp,
  Screenshot,
  screenshotSpanMs,
  selectFilmStripFrames,
  toDataUri,
} from '@trace-convenience/trace-core';
import { FilmStripSettingsService } from '../../services/film-strip-settings.service';

@Component({
  selector: 'app-film-strip',
  imports: [CommonModule],
  templateUrl: './film-strip.html',
  styleUrl: './film-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmStripComponent {
  private readonly settingsService = inject(FilmStripSettingsService);

  // Input properties
  readonly screenshots = input.required<Screenshot[]>();
  readonly startTime = input<number>(0);
  readonly endTime = input<number>(0);

  // State
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly isFullscreen = signal(false);
  protected readonly selectedFormat = signal<'png' | 'gif'>('png');
  protected readonly isFormatDropdownOpen = signal(false);

  // Get settings state from service
  protected readonly useIntervalFiltering =
    this.settingsService.useIntervalFiltering;
  protected readonly minIntervalMs = this.settingsService.minIntervalMs;
  protected readonly showTimestamps = this.settingsService.exportShowTimestamps;
  protected readonly useTimeRangeFilter =
    this.settingsService.useTimeRangeFilter;
  protected readonly startTimeMs = this.settingsService.startTimeMs;
  protected readonly endTimeMs = this.settingsService.endTimeMs;

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
  protected readonly hasScreenshots = computed(
    () => this.screenshots().length > 0
  );

  // Calculate the total duration in milliseconds
  protected readonly totalDurationMs = computed(() =>
    screenshotSpanMs(this.screenshots())
  );

  protected readonly screenshotsWithMetadata = computed(() =>
    selectFilmStripFrames(this.screenshots(), {
      timeRange: this.useTimeRangeFilter()
        ? { startMs: this.startTimeMs(), endMs: this.endTimeMs() }
        : undefined,
      intervalMs: this.useIntervalFiltering()
        ? this.minIntervalMs()
        : undefined,
      baseTimestamp: this.startTime(),
    }).map((frame) => ({ ...frame, dataUri: toDataUri(frame) }))
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

  protected readonly displayedCount = computed(
    () => this.screenshotsWithMetadata().length
  );

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

  protected toggleFormatDropdown(): void {
    this.isFormatDropdownOpen.update((open) => !open);
  }

  protected closeFormatDropdown(): void {
    this.isFormatDropdownOpen.set(false);
  }

  protected selectFormat(format: 'png' | 'gif'): void {
    this.selectedFormat.set(format);
    this.closeFormatDropdown();
  }

  protected async onDownload(): Promise<void> {
    const format = this.selectedFormat();
    if (format === 'gif') {
      await this.onDownloadGif();
    } else {
      await this.onDownloadPng();
    }
  }

  protected async onDownloadPng(): Promise<void> {
    const shots = this.screenshotsWithMetadata();
    if (shots.length === 0) return;

    try {
      // Create a canvas to composite all screenshots
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use settings from service
      const settings = this.settingsService.getSettings();
      const padding = settings.exportPadding;
      const showTimestamps = settings.exportShowTimestamps;
      const textHeight = showTimestamps ? 30 : 0;
      const maxImageHeight = settings.exportImageHeight;
      let totalWidth = 0;
      const imagePromises: Promise<HTMLImageElement>[] = [];

      // Load all images first
      for (const shot of shots) {
        const imgPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = shot.dataUri;
        });
        imagePromises.push(imgPromise);
      }

      const images = await Promise.all(imagePromises);

      // Calculate total width and set canvas size
      for (const img of images) {
        const aspectRatio = img.width / img.height;
        const scaledWidth = maxImageHeight * aspectRatio;
        totalWidth += scaledWidth + padding;
      }

      canvas.width = totalWidth + padding;
      canvas.height = maxImageHeight + textHeight + padding * 2;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each screenshot with its timestamp
      let xOffset = padding;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const shot = shots[i];
        const aspectRatio = img.width / img.height;
        const scaledWidth = maxImageHeight * aspectRatio;

        // Draw image
        ctx.drawImage(img, xOffset, padding, scaledWidth, maxImageHeight);

        // Draw timestamp below if enabled
        if (showTimestamps) {
          ctx.fillStyle = '#1f2937';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            shot.relativeTime,
            xOffset + scaledWidth / 2,
            maxImageHeight + padding + 20
          );
        }

        xOffset += scaledWidth + padding;
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `film-strip-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to download film strip:', error);
    }
  }

  protected async onDownloadGif(): Promise<void> {
    const shots = this.screenshotsWithMetadata();
    if (shots.length === 0) return;

    try {
      // Dynamic import of gifenc
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');

      const settings = this.settingsService.getSettings();
      const showTimestamps = settings.exportShowTimestamps;
      // Use higher resolution for better quality (2x the export height)
      const maxImageHeight = settings.exportImageHeight * 2;

      // Load all images
      const imagePromises: Promise<HTMLImageElement>[] = [];
      for (const shot of shots) {
        const imgPromise = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = shot.dataUri;
        });
        imagePromises.push(imgPromise);
      }
      const images = await Promise.all(imagePromises);

      // Use first image to determine dimensions
      const firstImg = images[0];
      const aspectRatio = firstImg.width / firstImg.height;
      const scaledWidth = Math.round(maxImageHeight * aspectRatio);
      const textHeight = showTimestamps ? 60 : 0;
      const canvasHeight = maxImageHeight + textHeight;

      // Create GIF encoder
      const gif = GIFEncoder();

      // Create a global palette from all frames for better color consistency
      const allImageData: Uint8ClampedArray[] = [];
      const frameCanvases: HTMLCanvasElement[] = [];

      // Pre-render all frames and collect image data
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const shot = shots[i];

        // Create canvas for this frame
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: true,
        });
        if (!ctx) continue;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image with high quality scaling
        ctx.drawImage(img, 0, 0, scaledWidth, maxImageHeight);

        // Draw timestamp if enabled
        if (showTimestamps) {
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shot.relativeTime, scaledWidth / 2, maxImageHeight + 40);
        }

        // Store canvas and collect image data
        frameCanvases.push(canvas);
        const imageData = ctx.getImageData(0, 0, scaledWidth, canvasHeight);
        allImageData.push(imageData.data);
      }

      // Create a global palette from all frames for consistent colors
      const combinedData = new Uint8ClampedArray(
        allImageData.reduce((acc, data) => acc + data.length, 0)
      );
      let offset = 0;
      for (const data of allImageData) {
        combinedData.set(data, offset);
        offset += data.length;
      }
      const globalPalette = quantize(combinedData, 256, { format: 'rgb444' });

      // Process each frame with the global palette
      for (let i = 0; i < frameCanvases.length; i++) {
        const canvas = frameCanvases[i];
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const imageData = ctx.getImageData(0, 0, scaledWidth, canvasHeight);
        const index = applyPalette(imageData.data, globalPalette);

        // Add frame to GIF (500ms delay between frames)
        gif.writeFrame(index, scaledWidth, canvasHeight, {
          palette: globalPalette,
          delay: 500,
        });
      }

      // Finish encoding
      gif.finish();

      // Download GIF
      const buffer = gif.bytes();
      // Convert to proper Uint8Array for Blob
      const blobData = new Uint8Array(buffer);
      const blob = new Blob([blobData], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `film-strip-${Date.now()}.gif`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download GIF:', error);
      alert('Failed to create GIF. Please try PNG format instead.');
    }
  }
}
