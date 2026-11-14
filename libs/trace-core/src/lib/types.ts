/** Image format of a captured screenshot. */
export type ImageFormat = 'jpeg' | 'png';

export interface Screenshot {
  /** Trace timestamp in microseconds. */
  timestamp: number;
  /** Base64-encoded image data (no data-URI prefix). */
  data: string;
  format: ImageFormat;
}

export interface ParsedTrace {
  screenshots: Screenshot[];
  metadata: {
    /** Timestamp of the first screenshot, in microseconds. */
    startTime: number;
    /** Timestamp of the last screenshot, in microseconds. */
    endTime: number;
    /** endTime - startTime, in microseconds. */
    duration: number;
    screenshotCount: number;
  };
}
