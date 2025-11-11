# Quick Start Guide - File Upload Feature

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npx nx serve web
```

The application will be available at: `http://localhost:4200`

### 2. Use the File Upload

**Option A: Drag & Drop**
1. Open the application in your browser
2. Drag one or more JSON files onto the drop zone
3. The zone will highlight when you hover over it
4. Drop the files to upload them

**Option B: Browse Files**
1. Click the "Browse Files" button
2. Select one or more JSON files from your computer
3. Files will be uploaded automatically

### 3. View Uploaded Files

- All uploaded files appear in the "Uploaded Files" section
- Each file shows:
  - File name
  - File size (formatted)
  - Upload timestamp

### 4. Manage Files

- **Remove a file:** Click the trash icon next to any file
- **Clear all files:** Click the "Clear All" button
- **Upload more:** Just drag/drop or browse for more files

## 📝 Test JSON Files

Create test files to try the feature:

### Simple Test File (`test.json`):
```json
{
  "message": "Hello, World!",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Complex Test File (`trace-data.json`):
```json
{
  "traceId": "abc-123",
  "spans": [
    {
      "id": "span-1",
      "name": "HTTP GET /api/users",
      "duration": 145,
      "tags": {
        "http.method": "GET",
        "http.status_code": 200
      }
    }
  ],
  "metadata": {
    "service": "user-service",
    "environment": "production"
  }
}
```

### Array Test File (`items.json`):
```json
[
  { "id": 1, "name": "Item 1" },
  { "id": 2, "name": "Item 2" },
  { "id": 3, "name": "Item 3" }
]
```

## 🎯 Expected Behavior

### ✅ Valid Scenarios

| Action | Result |
|--------|--------|
| Drop `.json` file | File uploads and appears in list |
| Click "Browse" + select JSON | File uploads and appears in list |
| Multiple files at once | All valid files upload |
| Valid JSON content | File is parsed and stored |

### ❌ Error Scenarios

| Action | Result |
|--------|--------|
| Drop `.txt` file | Error: "Only JSON files are accepted" |
| Drop `.json` with invalid content | Error: "Invalid JSON format" |
| Drop mix of valid/invalid | Valid files upload, errors shown for invalid |

## 🧪 Testing the Feature

### Manual Testing Checklist

- [ ] Drag a JSON file → Should upload successfully
- [ ] Drag a non-JSON file → Should show error
- [ ] Click "Browse Files" → Should open file picker
- [ ] Select multiple files → All should upload
- [ ] Upload file with invalid JSON → Should show parse error
- [ ] Remove individual file → Should remove from list
- [ ] Click "Clear All" → Should remove all files
- [ ] Check accessibility → Tab through all controls

### Automated Tests

```bash
# Run all tests
npx nx test web

# Run tests in watch mode
npx nx test web --watch

# Run with coverage
npx nx test web --coverage
```

## 💻 Accessing Uploaded Files Programmatically

### In a Component

```typescript
import { Component, inject } from '@angular/core';
import { TraceService } from './services/trace.service';

@Component({
  selector: 'app-my-component',
  template: `
    <h2>Total Files: {{ fileCount() }}</h2>
    <ul>
      @for (file of files(); track file.id) {
        <li>{{ file.name }}</li>
      }
    </ul>
  `
})
export class MyComponent {
  private traceService = inject(TraceService);
  
  // Access files
  files = this.traceService.allFiles;
  fileCount = this.traceService.fileCount;
  
  processFiles() {
    this.files().forEach(file => {
      console.log('File:', file.name);
      console.log('Content:', file.content);
    });
  }
}
```

### In a Service

```typescript
import { inject, Injectable } from '@angular/core';
import { TraceService } from './trace.service';

@Injectable({ providedIn: 'root' })
export class DataProcessorService {
  private traceService = inject(TraceService);
  
  processAllTraces() {
    const files = this.traceService.allFiles();
    
    return files.map(file => ({
      name: file.name,
      data: file.content,
      processedAt: new Date()
    }));
  }
}
```

## 🎨 UI Overview

### Header
- **Gradient background** (purple to pink)
- **Title:** "Trace File Upload"
- **Subtitle:** "Upload your JSON trace files for processing"

### Upload Zone
- **Default state:** Shows upload icon, instructions, and "Browse Files" button
- **Drag state:** Blue highlight with "Drop your JSON files here" message
- **Processing state:** Spinner with "Processing files..." message

### File List
- **Card layout** with file icons
- **File info:** Name, size, upload time
- **Actions:** Individual remove button, bulk "Clear All" button

### Errors
- **Red background** with error icon
- **Grouped list** of all errors with file names
- **Dismissible** when new files are uploaded or cleared

## 🔧 Troubleshooting

### Files Won't Upload

**Problem:** Files don't appear after dropping

**Solutions:**
1. Check browser console for errors
2. Verify file has `.json` extension
3. Try using "Browse Files" button instead
4. Refresh page and try again

### Invalid JSON Error

**Problem:** Getting "Invalid JSON format" error

**Solutions:**
1. Validate JSON at https://jsonlint.com
2. Check for:
   - Missing commas
   - Trailing commas
   - Unquoted keys
   - Single quotes instead of double quotes
3. Ensure file encoding is UTF-8

### Drag & Drop Not Working

**Problem:** Drag & drop has no effect

**Solutions:**
1. Try a different browser
2. Check browser permissions
3. Use "Browse Files" as alternative
4. Ensure JavaScript is enabled

## 📱 Mobile Usage

The interface is fully responsive:

- **Touch-friendly** controls
- **Larger tap targets** on mobile
- **No drag & drop** on mobile (use file picker)
- **Optimized layout** for small screens

## ♿ Accessibility

### Keyboard Navigation

1. **Tab** to "Browse Files" button → Press **Enter/Space** to open picker
2. **Tab** through uploaded files
3. **Tab** to remove buttons → Press **Enter/Space** to remove
4. **Tab** to "Clear All" button → Press **Enter/Space** to clear

### Screen Readers

All elements have proper labels:
- "File upload drop zone"
- "Select JSON files to upload"
- "Remove [filename]"
- "Clear all uploaded files"
- Status updates announced automatically

## 🎓 Learning Resources

### Relevant Files to Study

1. **TraceService** - Signal-based state management
   - `apps/web/src/app/services/trace.service.ts`
   
2. **FileUploadComponent** - Drag & drop implementation
   - `apps/web/src/app/components/file-upload/file-upload.ts`
   
3. **Tests** - Usage examples
   - `apps/web/src/app/services/trace.service.spec.ts`
   - `apps/web/src/app/components/file-upload/file-upload.spec.ts`

### Key Concepts

- **Angular Signals:** Reactive state management
- **Standalone Components:** No NgModules required
- **FileReader API:** Reading file contents
- **Drag & Drop API:** Handling file drops
- **Change Detection:** OnPush strategy
- **Accessibility:** WCAG AA compliance

## 📞 Need Help?

1. Check the documentation: `FILE_UPLOAD_FEATURE.md`
2. Review the implementation plan: `FEATURE_PLAN.md`
3. Look at test files for usage examples
4. Check browser console for error messages

## 🎉 Next Steps

After trying the basic functionality:

1. **Integrate with your data processing logic**
   - Access files via `TraceService`
   - Process JSON content as needed
   
2. **Customize the UI**
   - Modify styles in `file-upload.component.scss`
   - Update colors, fonts, layouts
   
3. **Add new features**
   - File preview
   - Server upload
   - Persistence
   - Advanced filtering

Happy coding! 🚀

