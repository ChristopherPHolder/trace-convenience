/** Formats microseconds as `450 μs`, `4.25 ms`, `125.3 ms` or `1.25 s`. */
export function formatDuration(microseconds: number): string {
  const ms = microseconds / 1000;
  if (ms < 1) return `${Math.round(microseconds)} μs`;
  if (ms < 10) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
