import { Injectable } from '@angular/core';

export interface Screenshot {
  timestamp: number;
  data: string; // base64 encoded image data
  format: string; // 'jpeg' or 'png'
}

export interface ParsedTrace {
  screenshots: Screenshot[];
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    screenshotCount: number;
  };
}

interface TraceEvent {
  name?: string;
  cat?: string;
  ph?: string;
  ts?: number;
  args?: {
    snapshot?: string;
    dataUri?: string;
    data?: string;
  };
}

interface ChromeTrace {
  traceEvents?: TraceEvent[];
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class TraceParserService {
  /**
   * Parses a Chrome DevTools trace file and extracts screenshots
   */
  parseTrace(traceContent: unknown): ParsedTrace {
    const screenshots: Screenshot[] = [];
    
    // Handle different trace formats
    const trace = traceContent as ChromeTrace;
    
    if (!trace || typeof trace !== 'object') {
      throw new Error('Invalid trace format');
    }

    // Extract trace events array
    const traceEvents = trace.traceEvents || [];
    
    if (!Array.isArray(traceEvents)) {
      throw new Error('Trace events must be an array');
    }

    // Filter for screenshot events
    // Chrome DevTools can capture screenshots in multiple ways:
    // 1. Screenshot events with name "Screenshot"
    // 2. Page.screencastFrame events
    // 3. Embedded snapshots with snapshot data

    for (const event of traceEvents) {
      if (!event || typeof event !== 'object') continue;

      const timestamp = event.ts || 0;

      // Check for Screenshot events
      if (event.name === 'Screenshot' && event.cat?.includes('disabled-by-default-devtools.screenshot')) {
        const snapshot = event.args?.snapshot;
        if (snapshot && typeof snapshot === 'string') {
          screenshots.push({
            timestamp,
            data: snapshot,
            format: this.detectImageFormat(snapshot),
          });
        }
      }

      // Check for screencast frame events (when using Chrome's screencast)
      if (event.name === 'ScreencastFrame' || event.name === 'screencastFrame') {
        const data = event.args?.dataUri || event.args?.data;
        if (data && typeof data === 'string') {
          // Extract base64 data from data URI if needed
          const imageData = this.extractBase64FromDataUri(data);
          screenshots.push({
            timestamp,
            data: imageData,
            format: this.detectImageFormat(imageData),
          });
        }
      }

      // Check for CaptureFrame events
      if (event.name === 'CaptureFrame') {
        const data = event.args?.data;
        if (data && typeof data === 'string') {
          screenshots.push({
            timestamp,
            data: this.extractBase64FromDataUri(data),
            format: this.detectImageFormat(data),
          });
        }
      }
    }

    // Sort screenshots by timestamp
    screenshots.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate time bounds from screenshots only
    let minTimestamp = 0;
    let maxTimestamp = 0;
    
    if (screenshots.length > 0) {
      minTimestamp = screenshots[0].timestamp;
      maxTimestamp = screenshots[screenshots.length - 1].timestamp;
    }

    return {
      screenshots,
      metadata: {
        startTime: minTimestamp,
        endTime: maxTimestamp,
        duration: maxTimestamp - minTimestamp,
        screenshotCount: screenshots.length,
      },
    };
  }

  /**
   * Extracts base64 image data from a data URI
   */
  private extractBase64FromDataUri(dataUri: string): string {
    // Check if it's already a data URI
    if (dataUri.startsWith('data:image/')) {
      // Extract the base64 part after the comma
      const commaIndex = dataUri.indexOf(',');
      if (commaIndex !== -1) {
        return dataUri.substring(commaIndex + 1);
      }
    }
    // If not a data URI, assume it's already base64
    return dataUri;
  }

  /**
   * Detects the image format from base64 data or data URI
   */
  private detectImageFormat(data: string): string {
    // Check data URI for format
    if (data.startsWith('data:image/')) {
      if (data.startsWith('data:image/jpeg') || data.startsWith('data:image/jpg')) {
        return 'jpeg';
      }
      if (data.startsWith('data:image/png')) {
        return 'png';
      }
    }

    // Try to detect from base64 magic numbers
    // JPEG starts with /9j/
    if (data.startsWith('/9j/')) {
      return 'jpeg';
    }
    
    // PNG starts with iVBOR
    if (data.startsWith('iVBOR')) {
      return 'png';
    }

    // Default to jpeg
    return 'jpeg';
  }

  /**
   * Converts a screenshot to a data URI for display
   */
  getDataUri(screenshot: Screenshot): string {
    const mimeType = screenshot.format === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${screenshot.data}`;
  }

  /**
   * Formats a timestamp (in microseconds) to a human-readable time
   */
  formatTimestamp(timestamp: number, baseTimestamp = 0): string {
    // Timestamps are in microseconds, convert to milliseconds
    const milliseconds = (timestamp - baseTimestamp) / 1000;
    
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    
    // Convert to seconds for display if >= 1 second
    const seconds = milliseconds / 1000;
    return `${seconds.toFixed(2)}s`;
  }

  /**
   * Calculates the time offset between screenshots
   */
  getTimeDelta(current: Screenshot, previous: Screenshot): number {
    return (current.timestamp - previous.timestamp) / 1000; // Convert to milliseconds
  }
}

