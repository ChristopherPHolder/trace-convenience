import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload';
import { TraceService } from '../../services/trace.service';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let traceService: TraceService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    traceService = TestBed.inject(TraceService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should not be dragging initially', () => {
      expect(component['isDragging']()).toBe(false);
    });

    it('should not be processing initially', () => {
      expect(component['isProcessing']()).toBe(false);
    });

    it('should have no errors initially', () => {
      expect(component['errors']()).toEqual([]);
    });

    it('should have no uploaded files initially', () => {
      expect(component['uploadedFiles']()).toEqual([]);
    });

    it('should not have files initially', () => {
      expect(component['hasFiles']()).toBe(false);
    });

    it('should have file count of 0 initially', () => {
      expect(component['fileCount']()).toBe(0);
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragging to true on dragover', () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as DragEvent;

      component['onDragOver'](event);

      expect(component['isDragging']()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should set isDragging to false on dragleave', () => {
      component['isDragging'].set(true);

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as DragEvent;

      component['onDragLeave'](event);

      expect(component['isDragging']()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle file drop', async () => {
      const jsonContent = JSON.stringify({ test: 'data' });
      const file = new File([jsonContent], 'test.json', {
        type: 'application/json',
      });

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file],
        },
      } as unknown as DragEvent;

      component['onDrop'](event);

      expect(component['isDragging']()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();

      // Wait for async file processing
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(traceService.fileCount()).toBe(1);
    });

    it('should add drag-over class when dragging', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      component['isDragging'].set(true);
      fixture.detectChanges();

      expect(compiled.classList.contains('drag-over')).toBe(true);
    });
  });

  describe('File Selection', () => {
    it('should handle file selection from input', async () => {
      const jsonContent = JSON.stringify({ test: 'data' });
      const file = new File([jsonContent], 'test.json', {
        type: 'application/json',
      });

      const mockFileList = {
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [0]: file,
      } as unknown as FileList;

      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', {
        value: mockFileList,
        writable: false,
      });

      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      component['onFileSelect'](event);

      // Wait for async file processing
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(traceService.fileCount()).toBe(1);
    });

    it('should reset input value after file selection', () => {
      const input = document.createElement('input');
      input.type = 'file';

      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      component['onFileSelect'](event);

      expect(input.value).toBe('');
    });
  });

  describe('File Validation', () => {
    it('should accept valid JSON files', async () => {
      const jsonContent = JSON.stringify({ valid: 'json' });
      const file = new File([jsonContent], 'valid.json', {
        type: 'application/json',
      });

      await component['processFiles']([file]);
      fixture.detectChanges();

      expect(component['errors']().length).toBe(0);
      expect(traceService.fileCount()).toBe(1);
    });

    it('should reject non-JSON files', async () => {
      const file = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      });

      await component['processFiles']([file]);
      fixture.detectChanges();

      expect(component['errors']().length).toBe(1);
      expect(component['errors']()[0].message).toBe('Only JSON files are accepted');
      expect(traceService.fileCount()).toBe(0);
    });

    it('should reject files with invalid JSON content', async () => {
      const file = new File(['{ invalid json }'], 'invalid.json', {
        type: 'application/json',
      });

      await component['processFiles']([file]);
      fixture.detectChanges();

      expect(component['errors']().length).toBe(1);
      expect(component['errors']()[0].message).toBe('Invalid JSON format');
      expect(traceService.fileCount()).toBe(0);
    });

    it('should process multiple files and show all errors', async () => {
      const validFile = new File([JSON.stringify({ valid: true })], 'valid.json');
      const invalidFile = new File(['invalid'], 'invalid.json');
      const txtFile = new File(['text'], 'file.txt');

      await component['processFiles']([validFile, invalidFile, txtFile]);
      fixture.detectChanges();

      expect(component['errors']().length).toBe(2);
      expect(traceService.fileCount()).toBe(1);
    });
  });

  describe('File Management', () => {
    beforeEach(async () => {
      const file1 = new File([JSON.stringify({ id: 1 })], 'file1.json');
      const file2 = new File([JSON.stringify({ id: 2 })], 'file2.json');

      await component['processFiles']([file1, file2]);
      fixture.detectChanges();
    });

    it('should remove a specific file', () => {
      const fileId = traceService.allFiles()[0].id;

      component['onRemoveFile'](fileId);
      fixture.detectChanges();

      expect(traceService.fileCount()).toBe(1);
    });

    it('should clear all files', () => {
      component['onClearAll']();
      fixture.detectChanges();

      expect(traceService.fileCount()).toBe(0);
      expect(component['errors']()).toEqual([]);
    });

    it('should update uploadedFiles when files are added', () => {
      expect(component['uploadedFiles']().length).toBe(2);
      expect(component['hasFiles']()).toBe(true);
      expect(component['fileCount']()).toBe(2);
    });
  });

  describe('Helper Methods', () => {
    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(component['formatFileSize'](0)).toBe('0 Bytes');
        expect(component['formatFileSize'](100)).toBe('100 Bytes');
        expect(component['formatFileSize'](1024)).toBe('1 KB');
        expect(component['formatFileSize'](1048576)).toBe('1 MB');
        expect(component['formatFileSize'](1073741824)).toBe('1 GB');
      });

      it('should round to 2 decimal places', () => {
        expect(component['formatFileSize'](1536)).toBe('1.5 KB');
        expect(component['formatFileSize'](1587)).toBe('1.55 KB');
      });
    });

    describe('formatDate', () => {
      it('should format date correctly', () => {
        const date = new Date('2024-01-15T10:30:00');
        const formatted = component['formatDate'](date);

        expect(formatted).toContain('1/15/24');
      });
    });

    describe('readFileAsText', () => {
      it('should read file content as text', async () => {
        const content = 'test content';
        const file = new File([content], 'test.txt');

        const result = await component['readFileAsText'](file);

        expect(result).toBe(content);
      });

      it('should reject on FileReader error', async () => {
        const file = new File([], 'test.txt');
        
        // Mock FileReader to simulate error
        const mockReader = {
          readAsText: vi.fn(),
          onerror: null,
          onload: null,
          error: new Error('Read failed'),
        };

        const originalFileReader = window.FileReader;
        window.FileReader = vi.fn().mockImplementation(() => mockReader) as unknown as typeof FileReader;

        const readPromise = component['readFileAsText'](file);
        
        // Trigger the error callback
        if (mockReader.onerror) {
          mockReader.onerror({} as ProgressEvent<FileReader>);
        }

        await expect(readPromise).rejects.toThrow();

        window.FileReader = originalFileReader;
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on drop zone', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dropZone = compiled.querySelector('.drop-zone');

      expect(dropZone?.getAttribute('role')).toBe('region');
      expect(dropZone?.getAttribute('aria-label')).toBe('File upload drop zone');
    });

    it('should have proper ARIA label on file input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const fileInput = compiled.querySelector('input[type="file"]');

      expect(fileInput?.getAttribute('aria-label')).toBe('Select JSON files to upload');
    });

    it('should have aria-live regions for status updates', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dropZone = compiled.querySelector('.drop-zone-content');

      expect(dropZone).toBeTruthy();
    });

    it('should show processing indicator with proper ARIA attributes', async () => {
      component['isProcessing'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const indicator = compiled.querySelector('.processing-indicator');

      expect(indicator?.getAttribute('role')).toBe('status');
      expect(indicator?.getAttribute('aria-live')).toBe('polite');
    });

    it('should show errors with proper ARIA attributes', async () => {
      component['errors'].set([
        { fileName: 'test.txt', message: 'Invalid file' },
      ]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorList = compiled.querySelector('.error-list');

      expect(errorList?.getAttribute('role')).toBe('alert');
      expect(errorList?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have proper ARIA labels on buttons', async () => {
      const file = new File([JSON.stringify({})], 'test.json');
      await component['processFiles']([file]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const clearButton = compiled.querySelector('button[aria-label*="Clear all"]');
      const removeButton = compiled.querySelector('button[aria-label*="Remove"]');

      expect(clearButton).toBeTruthy();
      expect(removeButton).toBeTruthy();
    });
  });

  describe('UI Rendering', () => {
    it('should show drag message when dragging', () => {
      component['isDragging'].set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dragMessage = compiled.querySelector('.drag-active');

      expect(dragMessage?.textContent).toContain('Drop your JSON files here');
    });

    it('should show idle message when not dragging', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const idleMessage = compiled.querySelector('.drop-zone-idle');

      expect(idleMessage?.textContent).toContain('Drag and drop JSON files here');
    });

    it('should show files section when files are uploaded', async () => {
      const file = new File([JSON.stringify({})], 'test.json');
      await component['processFiles']([file]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const filesSection = compiled.querySelector('.files-section');

      expect(filesSection).toBeTruthy();
    });

    it('should not show files section when no files are uploaded', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const filesSection = compiled.querySelector('.files-section');

      expect(filesSection).toBeFalsy();
    });

    it('should display file information correctly', async () => {
      const file = new File([JSON.stringify({ test: 'data' })], 'test.json');
      await component['processFiles']([file]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const fileName = compiled.querySelector('.file-name');

      expect(fileName?.textContent).toBe('test.json');
    });
  });
});

