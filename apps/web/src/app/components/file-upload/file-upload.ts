import { Component, ChangeDetectionStrategy, signal, computed, inject } from "@angular/core";
import { TraceService } from "../../services/trace.service";
import { TraceToolsComponent } from "../trace-tools/trace-tools";
import {
  PbBadge,
  PbButton,
  PbCard,
  PbEyebrow,
  PbIconButton,
  PbNotice,
  PbSpinner,
} from "../../design-system";

/** A short trace of this app loading, served from `public/`. Resolved against the base href. */
const SAMPLE_TRACE = "sample-trace.json";

interface UploadedFileDisplay {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

interface FileError {
  fileName: string;
  message: string;
}

@Component({
  selector: "app-file-upload",
  imports: [
    TraceToolsComponent,
    PbBadge,
    PbButton,
    PbCard,
    PbEyebrow,
    PbIconButton,
    PbNotice,
    PbSpinner,
  ],
  templateUrl: "./file-upload.html",
  styleUrl: "./file-upload.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.drag-over]": "isDragging()",
  },
})
export class FileUploadComponent {
  private readonly traceService = inject(TraceService);

  protected readonly isDragging = signal(false);
  protected readonly errors = signal<FileError[]>([]);
  protected readonly isProcessing = signal(false);

  /**
   * Counts loads, uploads and the sample alike. A load only touches state while it is the latest,
   * so a slow sample download can't replace a trace the user dropped in the meantime.
   */
  private latestLoad = 0;

  protected readonly uploadedFiles = computed<UploadedFileDisplay[]>(() =>
    this.traceService.allFiles().map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      uploadedAt: file.uploadedAt,
    })),
  );

  protected readonly hasFiles = computed(() => this.uploadedFiles().length > 0);
  protected readonly fileCount = computed(() => this.uploadedFiles().length);

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Only process the first file
      void this.processFiles([files[0]]);
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      // Only process the first file
      void this.processFiles([files[0]]);
    }
    // Reset input to allow selecting the same file again
    input.value = "";
  }

  /** Loads the bundled sample through the same path as an upload, so the rest of the app can't tell the difference. */
  protected async onLoadSampleTrace(): Promise<void> {
    const load = ++this.latestLoad;
    this.isProcessing.set(true);
    this.errors.set([]);

    let file: File;
    try {
      const response = await fetch(SAMPLE_TRACE);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      file = new File([await response.blob()], SAMPLE_TRACE, { type: "application/json" });
    } catch {
      if (load !== this.latestLoad) return;
      this.errors.set([{ fileName: SAMPLE_TRACE, message: "Could not load the sample trace" }]);
      this.isProcessing.set(false);
      return;
    }

    if (load !== this.latestLoad) return;
    await this.processFiles([file], load);
  }

  protected onRemoveFile(id: string): void {
    this.traceService.removeFile(id);
  }

  protected onClearAll(): void {
    this.traceService.clearAll();
    this.errors.set([]);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  private async processFiles(files: File[], load = ++this.latestLoad): Promise<void> {
    this.isProcessing.set(true);
    this.errors.set([]);

    this.traceService.clearAll();

    const newErrors: FileError[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.name.toLowerCase().endsWith(".json")) {
          newErrors.push({
            fileName: file.name,
            message: "Only JSON files are accepted",
          });
          continue;
        }

        // Read and parse JSON
        const content = await this.readFileAsText(file);
        if (load !== this.latestLoad) return;
        const jsonContent = JSON.parse(content);

        // Add to trace service
        this.traceService.addFile(file, jsonContent);
      } catch (error) {
        newErrors.push({
          fileName: file.name,
          message: error instanceof SyntaxError ? "Invalid JSON format" : "Failed to read file",
        });
      }
    }

    if (load !== this.latestLoad) return;

    if (newErrors.length > 0) {
      this.errors.set(newErrors);
    }

    this.isProcessing.set(false);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
