# File Upload Feature Documentation

## Overview

The file upload feature provides a drag-and-drop interface for uploading JSON files. Files are stored in memory using Angular signals for reactive state management.

## Architecture

### Components

#### FileUploadComponent
- **Location:** `apps/web/src/app/components/file-upload/`
- **Files:** `file-upload.ts`, `file-upload.html`, `file-upload.scss`
- **Selector:** `app-file-upload`
- **Purpose:** Reusable component for uploading JSON files via drag-and-drop or file picker

**Key Features:**
- Drag-and-drop file upload with visual feedback
- Click-to-browse file selection
- JSON file validation (extension and content)
- File size display and formatting
- Individual file removal
- Bulk file clearing
- Error handling with user-friendly messages
- Processing state indicators
- Fully accessible (WCAG AA compliant)

### Services

#### TraceService
- **Location:** `apps/web/src/app/services/trace.service.ts`
- **Purpose:** In-memory storage and management of uploaded JSON files

**Features:**
- Signal-based reactive state management
- CRUD operations for files
- Computed properties for derived state (count, isEmpty)
- Type-safe file storage with metadata

## Usage

### Basic Usage

```typescript
import { FileUploadComponent } from './components/file-upload/file-upload';

@Component({
  imports: [FileUploadComponent],
  template: `<app-file-upload />`
})
export class MyComponent {}
```

### Accessing Uploaded Files

```typescript
import { TraceService } from './services/trace.service';

export class MyComponent {
  private traceService = inject(TraceService);

  processFiles() {
    const files = this.traceService.allFiles();
    files.forEach(file => {
      console.log(file.name, file.content);
    });
  }
}
```

## File Structure

```
apps/web/src/app/
├── components/
│   └── file-upload/
│       ├── file-upload.ts      # Component logic
│       ├── file-upload.html    # Template
│       ├── file-upload.scss    # Styles
│       └── file-upload.spec.ts # Tests
└── services/
    ├── trace.service.ts        # Service logic
    └── trace.service.spec.ts   # Tests
```

## Data Model

### TraceFile Interface

```typescript
interface TraceFile {
  id: string;           // UUID generated via crypto.randomUUID()
  name: string;         // Original file name
  content: unknown;     // Parsed JSON content
  uploadedAt: Date;     // Upload timestamp
  size: number;         // File size in bytes
}
```

## Features

### File Validation

- **Extension Check:** Only `.json` files are accepted
- **Content Validation:** Files must contain valid JSON
- **Error Messages:** Clear, actionable error messages for invalid files

### User Experience

1. **Drag and Drop:**
   - Visual feedback when dragging files over the drop zone
   - Highlight border changes color on drag-over
   - Supports multiple file uploads

2. **File Picker:**
   - Standard file input with JSON filter
   - Multiple file selection supported
   - Accessible via keyboard

3. **File Display:**
   - Shows file name, size, and upload time
   - Human-readable file size formatting (Bytes, KB, MB, GB)
   - Localized date/time formatting

4. **Error Handling:**
   - Non-JSON files show appropriate error
   - Invalid JSON content shows parse error
   - Errors are displayed with visual indicators
   - Errors persist until cleared or new files uploaded

### Accessibility

The component follows WCAG AA standards:

- **Keyboard Navigation:** All interactions are keyboard accessible
- **ARIA Labels:** Proper labels on all interactive elements
- **Live Regions:** Status updates announced to screen readers
- **Focus Management:** Logical tab order and visible focus indicators
- **Color Contrast:** Meets minimum contrast ratios
- **Reduced Motion:** Respects user's motion preferences
- **High Contrast:** Enhanced borders in high contrast mode

## Testing

### Running Tests

```bash
# Run all tests
npx nx test web

# Run tests in watch mode
npx nx test web --watch

# Run tests with coverage
npx nx test web --coverage
```

### Test Coverage

- ✅ 18 tests for TraceService
- ✅ 36 tests for FileUploadComponent
- ✅ Total: 55 tests, all passing

**Coverage Areas:**
- Service CRUD operations
- File validation logic
- Drag-and-drop functionality
- File selection via input
- Error handling
- Helper methods (formatting, file reading)
- Accessibility attributes
- UI rendering states

## Styling

The component uses a modern, clean design with:

- **Color Scheme:** Blue primary (#3b82f6), neutral grays
- **Typography:** System font stack with proper hierarchy
- **Layout:** Flexbox for responsive design
- **Interactions:** Smooth transitions and hover states
- **Responsive:** Mobile-friendly with breakpoints at 640px

### Customization

The component styles can be customized by:

1. Modifying the SCSS variables in `file-upload.scss`
2. Using CSS custom properties (recommended for theming)
3. Overriding styles from parent components

## Performance

- **Signals:** Efficient reactive updates using Angular signals
- **Change Detection:** OnPush strategy for minimal re-renders
- **File Reading:** Asynchronous file processing with progress indicators
- **Bundle Size:** ~262 KB total (includes Angular runtime)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Required APIs:**
- File API
- FileReader API
- Crypto API (for UUID generation)

## Limitations

- **No Size Limit:** Files of any size are accepted (consider adding limits in production)
- **In-Memory Storage:** Files are lost on page refresh
- **No Persistence:** Files are not saved to server or local storage
- **Client-Side Only:** All processing happens in the browser

## Future Enhancements

Potential improvements:
- Add file size limits with validation
- Implement server upload functionality
- Add progress bars for large files
- Support for batch operations
- File preview/viewer for JSON content
- Export/download functionality
- LocalStorage/IndexedDB persistence
- Undo/redo functionality
- File deduplication

## Development Commands

```bash
# Serve the application
npx nx serve web

# Build for production
npx nx build web

# Run linter
npx nx lint web

# Run tests
npx nx test web

# View dependency graph
npx nx graph
```

## Troubleshooting

### Common Issues

**Files not uploading:**
- Check browser console for errors
- Verify file is valid JSON
- Ensure file has `.json` extension

**Drag-and-drop not working:**
- Check browser permissions
- Verify component is properly rendered
- Try using file picker as alternative

**Tests failing:**
- Run `npm install` to ensure dependencies are up to date
- Clear Nx cache: `npx nx reset`
- Check Node version compatibility

## Support

For issues or questions:
1. Check the test files for usage examples
2. Review the component source code
3. Check browser console for errors
4. Verify file format and content

