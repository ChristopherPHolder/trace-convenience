# Trace Convenience

> A modern web application for visualizing Chrome DevTools performance traces with an interactive film strip viewer

[![Built with Angular](https://img.shields.io/badge/Angular-20.3-DD0031?logo=angular)](https://angular.dev)
[![Built with Vite+](https://img.shields.io/badge/Vite%2B-1.5-646CFF?logo=vite)](https://viteplus.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Trace Convenience is a powerful browser-based tool that helps developers analyze and visualize Chrome DevTools performance traces. Upload your trace files and instantly view extracted screenshots in a beautiful, interactive film strip format - perfect for performance analysis, debugging, and sharing visual timelines of your application's behavior.

## ✨ Features

### 🎬 Interactive Film Strip

- **Visual Timeline**: View all captured screenshots from your trace in a horizontal scrollable film strip
- **Full Preview**: Click any frame to view it full-size with navigation controls
- **Keyboard Navigation**: Use arrow keys to move between frames quickly
- **Fullscreen Mode**: Press `F` to view frames in fullscreen for detailed analysis
- **Timestamp Display**: See precise timing information for each frame

### 📁 Smart File Handling

- **Drag & Drop**: Simply drag trace files onto the upload zone
- **Automatic Parsing**: Traces are automatically analyzed on upload
- **Multiple Format Support**: Handles various Chrome DevTools screenshot event types
- **Error Recovery**: Graceful handling of invalid or incomplete traces

## 🚀 Quick Start

### Prerequisites

- [Vite+](https://viteplus.dev) (`vp`): `curl -fsSL https://vite.plus | bash`

`vp` provisions the rest. Node.js is pinned in `.node-version` and pnpm in `package.json#devEngines`.

### Installation

```bash
# Clone the repository
git clone https://github.com/ChristopherPHolder/trace-convenience.git

# Navigate to the project directory
cd trace-convenience

# Install dependencies (also installs the pre-commit hook)
vp install

# Start the development server
vp run dev
```

The application will be available at `http://localhost:5173`

### Creating a Trace File

1. Open Chrome DevTools (`F12` or `Cmd+Option+I` on Mac)
2. Navigate to the **Performance** tab
3. Click the settings gear icon (⚙️) to open capture settings
4. Enable **Screenshots** in the capture settings
5. Click the **Record** button (●)
6. Perform the actions you want to trace
7. Click **Stop** to end recording
8. Save the trace: Right-click on the timeline → **Save profile...**

### Using the Application

1. **Upload**: Drag and drop your saved trace JSON file onto the upload zone
2. **View**: The film strip will automatically appear with all captured screenshots
3. **Navigate**: Click any screenshot to view it full-size
4. **Analyze**: Use arrow keys or navigation buttons to move between frames

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running quickly
- **[Chrome Trace Feature](CHROME_TRACE_FEATURE.md)** - Detailed feature documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical architecture and implementation details
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Contributing and development guidelines
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - How to deploy to GitHub Pages

## 🏗️ Architecture

Built with modern web technologies and best practices:

- **Framework**: Angular 22.3 with standalone components
- **State Management**: Angular Signals for reactive data flow
- **Toolchain**: [Vite+](https://viteplus.dev) (`vp`) for dev, build, test, lint (Oxlint) and format (Oxfmt); Angular compiled by [vite-plugin-ngp](https://push-based.github.io/vite-plugin-ngp/) (Angular compiled per module by ngp)
- **Testing**: Vitest with comprehensive test coverage (98 tests passing)
- **Styling**: Modern CSS with component-scoped SCSS
- **Type Safety**: TypeScript 6.0 in strict mode, templates type-checked on every build

### Key Components

- **TraceParserService**: Extracts screenshots from Chrome DevTools trace events
- **FilmStripComponent**: Interactive UI for displaying and navigating screenshots
- **TraceService**: Manages uploaded trace files with signal-based state
- **FileUploadComponent**: Drag-and-drop interface for trace file uploads

## 🧪 Testing

```bash
# Run all tests
vp test

# Run tests in watch mode
vp test --watch

# Run with coverage report
vp test --coverage

# Format, lint and type-check
vp check

# Everything CI runs: check, test and build
vp run ready
```

Current test coverage: **98 tests passing** across all components and services.

## 🔨 Building

```bash
# Production build (outputs to apps/web/dist, served from /trace-convenience/)
vp run web#build

# Serve the production build locally at http://localhost:4173/trace-convenience/
vp run web#preview
```

## 🌐 Browser Support

Works in all modern browsers supporting:

- ES2020+
- CSS Grid and Flexbox
- File API and FileReader
- Base64 image decoding

Tested on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please read our [Developer Guide](DEVELOPER_GUIDE.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run checks, tests and build (`vp run ready`). The pre-commit hook already formats and lints staged files.
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Angular](https://angular.dev) - The modern web developer's platform
- Powered by [Vite+](https://viteplus.dev) - The unified toolchain for the web
- Uses [gifenc](https://github.com/mattdesl/gifenc) for potential GIF export features
- Chrome DevTools Protocol types from [devtools-protocol](https://github.com/ChromeDevTools/devtools-protocol)

## 📧 Support

For questions, issues, or feature requests:

- Open an [issue](https://github.com/ChristopherPHolder/trace-convenience/issues)
- Check existing [documentation](CHROME_TRACE_FEATURE.md)
- Review the [troubleshooting guide](QUICK_START.md#-troubleshooting)

---

Built with ❤️ using Angular and Nx
