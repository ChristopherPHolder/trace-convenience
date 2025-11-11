# Chrome DevTools Trace Film Strip Feature

## Overview

This feature allows you to upload Chrome DevTools trace files and automatically extract and display screenshots in a beautiful film strip format.

## How to Use

1. **Capture a Trace with Screenshots**
   - Open Chrome DevTools (F12)
   - Go to the Performance tab
   - Click the gear icon (⚙️) to open settings
   - Enable "Screenshots" in the capture settings
   - Click Record and perform your actions
   - Stop recording and save the trace as a JSON file

2. **Upload the Trace**
   - Drag and drop your trace JSON file onto the upload area
   - Or click "Browse Files" to select your trace file
   - The file will be automatically processed

3. **View the Film Strip**
   - Once uploaded, screenshots will be displayed in a horizontal film strip
   - Each frame shows:
     - The screenshot thumbnail
     - Timestamp relative to the start of the trace
     - Time delta from the previous screenshot

4. **Interact with Screenshots**
   - **Click** any screenshot to view it in full size
   - **Navigate** between screenshots using:
     - Arrow buttons in the preview
     - Keyboard arrow keys (← →)
   - **Toggle fullscreen** mode with the fullscreen button or press 'F'
   - **Close preview** by clicking the X button or pressing 'Escape'

## Technical Details

### Components

- **TraceParserService**: Extracts screenshots from Chrome DevTools trace events
  - Supports multiple screenshot event types:
    - `Screenshot` events with `disabled-by-default-devtools.screenshot` category
    - `ScreencastFrame` events
    - `CaptureFrame` events
  - Handles both JPEG and PNG formats
  - Processes base64-encoded image data

- **FilmStripComponent**: Displays the extracted screenshots
  - Responsive horizontal scrolling film strip
  - Large preview with keyboard navigation
  - Fullscreen mode support
  - Accessibility features (ARIA labels, keyboard navigation)

- **TraceService**: Manages uploaded trace files
  - Automatically parses traces on upload
  - Provides reactive signals for the current trace data
  - Gracefully handles parsing errors

### Dependencies

- **devtools-protocol**: Provides TypeScript types for Chrome DevTools Protocol

### Supported Trace Formats

The parser supports standard Chrome DevTools trace JSON format with the following screenshot event types:

1. **Screenshot Events** (most common)
```json
{
  "name": "Screenshot",
  "cat": "disabled-by-default-devtools.screenshot",
  "ts": 1000000,
  "args": {
    "snapshot": "base64_encoded_image_data"
  }
}
```

2. **Screencast Frame Events**
```json
{
  "name": "ScreencastFrame",
  "ts": 1000000,
  "args": {
    "dataUri": "data:image/jpeg;base64,..."
  }
}
```

3. **Capture Frame Events**
```json
{
  "name": "CaptureFrame",
  "ts": 1000000,
  "args": {
    "data": "data:image/jpeg;base64,..."
  }
}
```

## Features

### Film Strip Display
- Horizontal scrollable thumbnail view
- Hover effects and visual feedback
- Responsive design for mobile and desktop
- Lazy loading of images for performance

### Screenshot Preview
- Full-size image viewer
- Previous/Next navigation
- Keyboard shortcuts (Arrow keys, F for fullscreen, Esc to close)
- Fullscreen mode
- Timestamp and metadata display

### Error Handling
- Graceful handling of traces without screenshots
- Clear error messages for invalid files
- Console warnings for parsing issues without breaking the UI

## Architecture

The feature is built with Angular's latest features:
- **Signals** for reactive state management
- **Computed signals** for derived state
- **Standalone components** for better modularity
- **OnPush change detection** for optimal performance
- **Input signals** for component communication

## Testing

All components and services include comprehensive test suites:
- Unit tests for all public methods
- Component interaction tests
- Accessibility tests
- Error handling tests

Run tests with:
```bash
npx nx test web
```

## Browser Support

Works in all modern browsers that support:
- ES2020+
- CSS Grid and Flexbox
- Base64 image decoding
- File API

## Future Enhancements

Potential improvements for future releases:
- Export screenshots as individual files
- Timeline scrubbing to jump to specific frames
- Side-by-side comparison of multiple traces
- Performance metrics overlay on screenshots
- Video export from screenshot sequence
- Filtering and search capabilities

