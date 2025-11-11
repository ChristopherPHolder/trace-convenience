import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraceService } from '../../services/trace.service';

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
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.drag-over]': 'isDragging()',
  },
})
export class FileUploadComponent {
  private readonly traceService = inject(TraceService);

  protected readonly isDragging = signal(false);
  protected readonly errors = signal<FileError[]>([]);
  protected readonly isProcessing = signal(false);

  protected readonly uploadedFiles = computed<UploadedFileDisplay[]>(() =>
    this.traceService.allFiles().map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      uploadedAt: file.uploadedAt,
    }))
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
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
    // Reset input to allow selecting the same file again
    input.value = '';
  }

  protected onRemoveFile(id: string): void {
    this.traceService.removeFile(id);
  }

  protected onClearAll(): void {
    this.traceService.clearAll();
    this.errors.set([]);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  private async processFiles(files: File[]): Promise<void> {
    this.isProcessing.set(true);
    this.errors.set([]);

    const newErrors: FileError[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
          newErrors.push({
            fileName: file.name,
            message: 'Only JSON files are accepted',
          });
          continue;
        }

        // Read and parse JSON
        const content = await this.readFileAsText(file);
        const jsonContent = JSON.parse(content);

        // Add to trace service
        this.traceService.addFile(file, jsonContent);
      } catch (error) {
        newErrors.push({
          fileName: file.name,
          message:
            error instanceof SyntaxError
              ? 'Invalid JSON format'
              : 'Failed to read file',
        });
      }
    }

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

