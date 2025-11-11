import { Injectable, signal, computed, inject } from '@angular/core';
import { TraceParserService, ParsedTrace } from './trace-parser.service';

export interface TraceFile {
  id: string;
  name: string;
  content: unknown;
  uploadedAt: Date;
  size: number;
  parsedData?: ParsedTrace;
}

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  private readonly traceParser = inject(TraceParserService);
  private files = signal<TraceFile[]>([]);

  readonly allFiles = this.files.asReadonly();
  readonly fileCount = computed(() => this.files().length);
  readonly isEmpty = computed(() => this.files().length === 0);
  
  readonly currentFile = computed(() => {
    const files = this.files();
    return files.length > 0 ? files[0] : null;
  });

  readonly currentParsedTrace = computed(() => {
    return this.currentFile()?.parsedData || null;
  });

  addFile(file: File, content: unknown): void {
    let parsedData: ParsedTrace | undefined;
    
    // Try to parse the trace file to extract screenshots
    try {
      parsedData = this.traceParser.parseTrace(content);
    } catch (error) {
      console.warn('Failed to parse trace file:', error);
      // Continue anyway - we still want to store the file even if parsing fails
    }

    const traceFile: TraceFile = {
      id: crypto.randomUUID(),
      name: file.name,
      content,
      uploadedAt: new Date(),
      size: file.size,
      parsedData,
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

