import type { Screenshot } from './types';

/**
 * Formats a microsecond timestamp relative to `baseTimestamp` as `"123ms"`
 * below one second, otherwise `"1.23s"`.
 */
export function formatTimestamp(timestamp: number, baseTimestamp = 0): string {
  const milliseconds = (timestamp - baseTimestamp) / 1000;
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/** Milliseconds between two screenshots. */
export function getTimeDelta(
  current: Screenshot,
  previous: Screenshot
): number {
  return (current.timestamp - previous.timestamp) / 1000;
}
