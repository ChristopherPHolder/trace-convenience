import { Injectable, signal, computed } from '@angular/core';

export interface TraceFile {
  id: string;
  name: string;
  content: unknown;
  uploadedAt: Date;
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  private files = signal<TraceFile[]>([]);

  readonly allFiles = this.files.asReadonly();
  readonly fileCount = computed(() => this.files().length);
  readonly isEmpty = computed(() => this.files().length === 0);

  addFile(file: File, content: unknown): void {
    const traceFile: TraceFile = {
      id: crypto.randomUUID(),
      name: file.name,
      content,
      uploadedAt: new Date(),
      size: file.size,
    };

    this.files.update((current) => [...current, traceFile]);
  }

  removeFile(id: string): void {
    this.files.update((current) => current.filter((file) => file.id !== id));
  }

  clearAll(): void {
    this.files.set([]);
  }

  getFileById(id: string): TraceFile | undefined {
    return this.files().find((file) => file.id === id);
  }
}

