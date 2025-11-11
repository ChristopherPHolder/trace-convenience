# Developer Guide - Chrome DevTools Trace Film Strip

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Chrome browser (for capturing traces)

### Installation
```bash
# Install dependencies
npm install

# The devtools-protocol package is already included
```

### Development
```bash
# Start development server
npx nx serve web

# Run tests
npx nx test web

# Run tests in watch mode
npx nx test web --watch

# Build for production
npx nx build web
```

## Capturing a Test Trace

To test the feature, you need a Chrome DevTools trace with screenshots:

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click the **gear icon** (⚙️) in the Performance panel
4. Ensure **Screenshots** is **checked**
5. Click **Record** (⚫)
6. Perform some actions (navigate, scroll, click buttons)
7. Click **Stop**
8. Right-click the performance timeline
9. Select **Save profile...**
10. Save as JSON

## Project Structure

```
apps/web/src/app/
├── components/
│   ├── file-upload/          # Main upload component
│   │   ├── file-upload.ts
│   │   ├── file-upload.html
│   │   ├── file-upload.scss
│   │   └── file-upload.spec.ts
│   └── film-strip/           # Screenshot display component
│       ├── film-strip.ts
│       ├── film-strip.html
│       ├── film-strip.scss
│       └── film-strip.spec.ts
└── services/
    ├── trace.service.ts       # Trace file management
    ├── trace.service.spec.ts
    ├── trace-parser.service.ts # Screenshot extraction
    └── trace-parser.service.spec.ts
```

## Key Concepts

### Signals-Based Architecture

The application uses Angular's new Signals API for reactive state management:

```typescript
// Creating a signal
const count = signal(0);

// Reading a signal
console.log(count());

// Updating a signal
count.set(5);
count.update(prev => prev + 1);

// Computed signal (automatically updates)
const doubled = computed(() => count() * 2);
```

### Component Communication

Components use input signals for props:

```typescript
// Parent component template
<app-film-strip
  [screenshots]="screenshots()"
  [startTime]="startTime()"
  [endTime]="endTime()"
/>

// Child component
export class FilmStripComponent {
  readonly screenshots = input.required<Screenshot[]>();
  readonly startTime = input<number>(0);
  readonly endTime = input<number>(0);
}
```

### Service Injection

Services are injected using the modern `inject()` function:

```typescript
export class MyComponent {
  private readonly traceService = inject(TraceService);
  private readonly parser = inject(TraceParserService);
}
```

## Adding New Screenshot Event Types

To support additional screenshot event types:

1. Open `trace-parser.service.ts`
2. Locate the `parseTrace()` method
3. Add a new condition in the event loop:

```typescript
// Example: Adding support for a new event type
if (event.name === 'NewScreenshotType') {
  const imageData = event.args?.imageData;
  if (imageData && typeof imageData === 'string') {
    screenshots.push({
      timestamp,
      data: this.extractBase64FromDataUri(imageData),
      format: this.detectImageFormat(imageData),
    });
  }
}
```

4. Add tests in `trace-parser.service.spec.ts`

## Customizing the Film Strip UI

### Changing Thumbnail Size

Edit `film-strip.scss`:

```scss
.film-frame {
  width: 160px; // Change this value
}

.frame-image-wrapper {
  height: 90px; // Change this value
}
```

### Modifying Colors

Update the color scheme in `film-strip.scss`:

```scss
// Primary color (for selections, borders)
$primary: #6366f1;

// Background colors
$bg-light: #f9fafb;
$bg-white: #ffffff;

// Text colors
$text-dark: #1f2937;
$text-gray: #6b7280;
```

### Adding New Metadata

To display additional information about screenshots:

1. Update the `Screenshot` interface in `trace-parser.service.ts`
2. Extract the data in `parseTrace()`
3. Add UI elements in `film-strip.html`

## Testing

### Unit Tests

Run all tests:
```bash
npx nx test web
```

Run specific test file:
```bash
npx nx test web --testFile=trace-parser.service.spec.ts
```

### Writing New Tests

Example test structure:

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyService);
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    
    // Set input values
    fixture.componentRef.setInput('myInput', 'value');
    
    fixture.detectChanges();
  });

  it('should display something', () => {
    const element = fixture.nativeElement.querySelector('.my-class');
    expect(element.textContent).toContain('expected text');
  });
});
```

## Debugging

### Enabling Trace Parsing Logs

Uncomment console logs in `trace-parser.service.ts`:

```typescript
parseTrace(traceContent: unknown): ParsedTrace {
  console.log('Parsing trace:', traceContent); // Debug log
  
  // ... rest of the code
}
```

### Inspecting Signals

Use Angular DevTools browser extension:
1. Install Angular DevTools
2. Open DevTools
3. Select "Angular" tab
4. View component signals in real-time

### Common Issues

**Issue: Screenshots not appearing**
- Check browser console for errors
- Verify trace file has screenshot events
- Ensure screenshots were enabled during capture

**Issue: Images not loading**
- Check that base64 data is valid
- Verify image format detection is working
- Check browser console for security errors

**Issue: Tests failing**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that all imports are correct
- Verify test data matches expected format

## Performance Optimization

### Handling Large Traces

For traces with many screenshots (100+):

1. **Implement Virtual Scrolling**
   ```bash
   npm install @angular/cdk
   ```

2. **Add to film-strip component:**
   ```typescript
   import { ScrollingModule } from '@angular/cdk/scrolling';
   
   @Component({
     imports: [CommonModule, ScrollingModule],
     // ...
   })
   ```

3. **Update template:**
   ```html
   <cdk-virtual-scroll-viewport itemSize="176" class="film-strip-scroll">
     <div *cdkVirtualFor="let screenshot of screenshots()">
       <!-- thumbnail content -->
     </div>
   </cdk-virtual-scroll-viewport>
   ```

### Memory Management

For very large traces:
- Consider thumbnail generation (resize before display)
- Implement pagination or infinite scroll
- Use Web Workers for parsing (see example below)

### Web Worker Example

```typescript
// trace-parser.worker.ts
addEventListener('message', ({ data }) => {
  const parsed = parseTraceSync(data);
  postMessage(parsed);
});

// In component:
const worker = new Worker(new URL('./trace-parser.worker', import.meta.url));
worker.postMessage(traceData);
worker.onmessage = ({ data }) => {
  this.parsedTrace.set(data);
};
```

## API Reference

### TraceParserService

**Methods:**
- `parseTrace(traceContent: unknown): ParsedTrace`
  - Parses a Chrome DevTools trace and extracts screenshots
  - Returns: ParsedTrace object with screenshots and metadata
  - Throws: Error if trace format is invalid

- `getDataUri(screenshot: Screenshot): string`
  - Converts a screenshot to a displayable data URI
  - Returns: data:image/[type];base64,[data]

- `formatTimestamp(timestamp: number, baseTimestamp?: number): string`
  - Formats timestamp to human-readable format (ms or seconds)
  - baseTimestamp: Optional reference point for relative time

- `getTimeDelta(current: Screenshot, previous: Screenshot): number`
  - Calculates time difference between screenshots in milliseconds

### TraceService

**Signals:**
- `allFiles(): readonly TraceFile[]` - All uploaded files
- `fileCount(): number` - Number of uploaded files
- `isEmpty(): boolean` - Whether any files are uploaded
- `currentFile(): TraceFile | null` - Currently active file
- `currentParsedTrace(): ParsedTrace | null` - Parsed trace data

**Methods:**
- `addFile(file: File, content: unknown): void` - Upload a new trace file
- `removeFile(id: string): void` - Remove a file by ID
- `clearAll(): void` - Remove all files
- `getFileById(id: string): TraceFile | undefined` - Get file by ID

### FilmStripComponent

**Inputs:**
- `screenshots: Screenshot[]` - Array of screenshots to display
- `startTime: number` - Trace start timestamp (default: 0)
- `endTime: number` - Trace end timestamp (default: 0)

**Interactions:**
- Click thumbnail to preview
- Arrow keys to navigate
- 'F' to toggle fullscreen
- 'Escape' to close preview

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow Angular style guide
- Use Prettier for formatting
- Use ESLint for linting

### Commit Messages
Follow conventional commits:
```
feat: add new screenshot event type
fix: resolve timestamp calculation issue
docs: update developer guide
test: add tests for edge cases
```

### Pull Request Process
1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit PR with clear description

## Resources

- [Angular Documentation](https://angular.dev)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [DevTools Protocol NPM Package](https://www.npmjs.com/package/devtools-protocol)
- [Nx Documentation](https://nx.dev)
- [Vitest Documentation](https://vitest.dev)

## Support

For issues or questions:
1. Check the documentation
2. Review existing tests for examples
3. Open an issue on GitHub
4. Contact the development team

