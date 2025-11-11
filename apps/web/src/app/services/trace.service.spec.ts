import { TestBed } from '@angular/core/testing';
import { TraceService } from './trace.service';

describe('TraceService', () => {
  let service: TraceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TraceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty files array', () => {
      expect(service.allFiles()).toEqual([]);
    });

    it('should have fileCount of 0 initially', () => {
      expect(service.fileCount()).toBe(0);
    });

    it('should be empty initially', () => {
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('addFile', () => {
    it('should add a file to the collection', () => {
      const mockFile = new File(['{}'], 'test.json', { type: 'application/json' });
      const mockContent = { test: 'data' };

      service.addFile(mockFile, mockContent);

      expect(service.fileCount()).toBe(1);
      expect(service.isEmpty()).toBe(false);
    });

    it('should store file with correct properties', () => {
      const mockFile = new File(['{"key":"value"}'], 'test.json', { 
        type: 'application/json' 
      });
      const mockContent = { key: 'value' };

      service.addFile(mockFile, mockContent);

      const files = service.allFiles();
      expect(files.length).toBe(1);
      expect(files[0].name).toBe('test.json');
      expect(files[0].content).toEqual(mockContent);
      expect(files[0].size).toBe(mockFile.size);
      expect(files[0].id).toBeDefined();
      expect(files[0].uploadedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for each file', () => {
      const mockFile1 = new File(['{}'], 'test1.json');
      const mockFile2 = new File(['{}'], 'test2.json');

      service.addFile(mockFile1, {});
      service.addFile(mockFile2, {});

      const files = service.allFiles();
      expect(files[0].id).not.toBe(files[1].id);
    });

    it('should add multiple files', () => {
      const mockFile1 = new File(['{}'], 'test1.json');
      const mockFile2 = new File(['{}'], 'test2.json');
      const mockFile3 = new File(['{}'], 'test3.json');

      service.addFile(mockFile1, {});
      service.addFile(mockFile2, {});
      service.addFile(mockFile3, {});

      expect(service.fileCount()).toBe(3);
      expect(service.allFiles().length).toBe(3);
    });
  });

  describe('removeFile', () => {
    it('should remove a file by ID', () => {
      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      const fileId = service.allFiles()[0].id;
      service.removeFile(fileId);

      expect(service.fileCount()).toBe(0);
      expect(service.isEmpty()).toBe(true);
    });

    it('should remove only the specified file', () => {
      const mockFile1 = new File(['{}'], 'test1.json');
      const mockFile2 = new File(['{}'], 'test2.json');
      const mockFile3 = new File(['{}'], 'test3.json');

      service.addFile(mockFile1, {});
      service.addFile(mockFile2, {});
      service.addFile(mockFile3, {});

      const fileIdToRemove = service.allFiles()[1].id;
      service.removeFile(fileIdToRemove);

      expect(service.fileCount()).toBe(2);
      expect(service.allFiles().find(f => f.id === fileIdToRemove)).toBeUndefined();
    });

    it('should do nothing if file ID does not exist', () => {
      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      service.removeFile('non-existent-id');

      expect(service.fileCount()).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should remove all files', () => {
      const mockFile1 = new File(['{}'], 'test1.json');
      const mockFile2 = new File(['{}'], 'test2.json');

      service.addFile(mockFile1, {});
      service.addFile(mockFile2, {});

      service.clearAll();

      expect(service.fileCount()).toBe(0);
      expect(service.isEmpty()).toBe(true);
      expect(service.allFiles()).toEqual([]);
    });

    it('should work even when no files exist', () => {
      service.clearAll();

      expect(service.fileCount()).toBe(0);
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('getFileById', () => {
    it('should return the correct file by ID', () => {
      const mockFile = new File(['{}'], 'test.json');
      const mockContent = { test: 'data' };

      service.addFile(mockFile, mockContent);

      const fileId = service.allFiles()[0].id;
      const retrievedFile = service.getFileById(fileId);

      expect(retrievedFile).toBeDefined();
      expect(retrievedFile?.id).toBe(fileId);
      expect(retrievedFile?.name).toBe('test.json');
      expect(retrievedFile?.content).toEqual(mockContent);
    });

    it('should return undefined for non-existent ID', () => {
      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      const retrievedFile = service.getFileById('non-existent-id');

      expect(retrievedFile).toBeUndefined();
    });

    it('should return undefined when no files exist', () => {
      const retrievedFile = service.getFileById('any-id');

      expect(retrievedFile).toBeUndefined();
    });
  });

  describe('Computed Signals', () => {
    it('should update fileCount when files are added', () => {
      expect(service.fileCount()).toBe(0);

      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      expect(service.fileCount()).toBe(1);
    });

    it('should update isEmpty when files are added or removed', () => {
      expect(service.isEmpty()).toBe(true);

      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      expect(service.isEmpty()).toBe(false);

      const fileId = service.allFiles()[0].id;
      service.removeFile(fileId);

      expect(service.isEmpty()).toBe(true);
    });

    it('should provide currentFile computed signal', () => {
      expect(service.currentFile()).toBeNull();

      const mockFile = new File(['{}'], 'test.json');
      service.addFile(mockFile, {});

      expect(service.currentFile()).toBeDefined();
      expect(service.currentFile()?.name).toBe('test.json');
    });

    it('should provide currentParsedTrace computed signal', () => {
      expect(service.currentParsedTrace()).toBeNull();

      const mockFile = new File(['{}'], 'test.json');
      const traceContent = {
        traceEvents: [
          {
            name: 'Screenshot',
            cat: 'disabled-by-default-devtools.screenshot',
            ts: 1000000,
            args: { snapshot: '/9j/test' },
          },
        ],
      };
      service.addFile(mockFile, traceContent);

      const parsedTrace = service.currentParsedTrace();
      expect(parsedTrace).toBeDefined();
      expect(parsedTrace?.screenshots).toBeDefined();
    });
  });

  describe('Trace Parsing', () => {
    it('should parse trace data when adding a file', () => {
      const mockFile = new File(['{}'], 'test.json');
      const traceContent = {
        traceEvents: [
          {
            name: 'Screenshot',
            cat: 'disabled-by-default-devtools.screenshot',
            ts: 1000000,
            args: { snapshot: '/9j/testdata' },
          },
        ],
      };

      service.addFile(mockFile, traceContent);

      const file = service.allFiles()[0];
      expect(file.parsedData).toBeDefined();
      expect(file.parsedData?.screenshots.length).toBe(1);
      expect(file.parsedData?.metadata).toBeDefined();
    });

    it('should handle invalid trace data gracefully', () => {
      const mockFile = new File(['{}'], 'test.json');
      const invalidContent = { invalid: 'data' };

      // Should not throw
      expect(() => service.addFile(mockFile, invalidContent)).not.toThrow();

      const file = service.allFiles()[0];
      expect(file).toBeDefined();
      expect(file.parsedData?.screenshots || []).toEqual([]);
    });

    it('should handle trace parsing errors', () => {
      const mockFile = new File(['{}'], 'test.json');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.addFile(mockFile, null);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(service.allFiles()[0]).toBeDefined();
      
      consoleWarnSpy.mockRestore();
    });
  });
});

