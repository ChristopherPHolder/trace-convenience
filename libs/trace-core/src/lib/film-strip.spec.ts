import { screenshotSpanMs, selectFilmStripFrames } from './film-strip';
import type { Screenshot } from './types';

/** Builds screenshots at the given offsets (ms) from a fixed origin. */
const ORIGIN = 5_000_000;
const shotsAtMs = (...offsetsMs: number[]): Screenshot[] =>
  offsetsMs.map((ms, i) => ({
    timestamp: ORIGIN + ms * 1000,
    data: `frame${i}`,
    format: 'jpeg',
  }));

const dataOf = (frames: { data: string }[]) => frames.map((f) => f.data);
const displayMsOf = (frames: { displayTimestamp: number }[]) =>
  frames.map((f) => (f.displayTimestamp - ORIGIN) / 1000);

describe('screenshotSpanMs', () => {
  it('is 0 for no screenshots', () => {
    expect(screenshotSpanMs([])).toBe(0);
  });

  it('is the gap between first and last screenshot in ms', () => {
    expect(screenshotSpanMs(shotsAtMs(0, 400, 1500))).toBe(1500);
  });
});

describe('selectFilmStripFrames', () => {
  it('returns no frames for no screenshots', () => {
    expect(
      selectFilmStripFrames([], {
        intervalMs: 100,
        timeRange: { startMs: 0, endMs: 10 },
      })
    ).toEqual([]);
  });

  describe('without filters', () => {
    it('returns every screenshot with index, relative time and delta', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 250, 1200));

      expect(dataOf(frames)).toEqual(['frame0', 'frame1', 'frame2']);
      expect(frames.map((f) => f.index)).toEqual([0, 1, 2]);
      expect(frames.map((f) => f.relativeTime)).toEqual([
        '0ms',
        '250ms',
        '1.20s',
      ]);
      expect(frames.map((f) => f.delta)).toEqual([0, 250, 950]);
      expect(frames.every((f) => f.syntheticTimestamp === undefined)).toBe(
        true
      );
    });

    it('measures relative time from baseTimestamp when given', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 250), {
        baseTimestamp: ORIGIN - 1_000_000,
      });
      expect(frames.map((f) => f.relativeTime)).toEqual(['1.00s', '1.25s']);
    });
  });

  describe('time range', () => {
    it('keeps frames in the window plus one context frame on each side', () => {
      const shots = shotsAtMs(0, 100, 200, 300, 400, 500);
      const frames = selectFilmStripFrames(shots, {
        timeRange: { startMs: 150, endMs: 350 },
      });

      // 100 is on screen at 150, 400 is the first frame showing the state after 350.
      expect(displayMsOf(frames)).toEqual([100, 200, 300, 400]);
    });

    it('does not add context frames when boundaries land exactly on frames', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 100, 200, 300), {
        timeRange: { startMs: 100, endMs: 200 },
      });
      expect(displayMsOf(frames)).toEqual([100, 200]);
    });

    it('measures relative time from the window start, ignoring baseTimestamp', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 100, 200), {
        timeRange: { startMs: 50, endMs: 200 },
        baseTimestamp: 0,
      });
      expect(frames.map((f) => f.relativeTime)).toEqual([
        '-50ms',
        '50ms',
        '150ms',
      ]);
    });
  });

  describe('interval sampling', () => {
    it('samples the most recent screenshot at each interval step', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 130, 300), {
        intervalMs: 100,
      });

      expect(displayMsOf(frames)).toEqual([0, 100, 200, 300]);
      expect(dataOf(frames)).toEqual(['frame0', 'frame0', 'frame1', 'frame2']);
      expect(frames.map((f) => f.delta)).toEqual([0, 100, 100, 100]);
      expect(frames.map((f) => f.relativeTime)).toEqual([
        '0ms',
        '100ms',
        '200ms',
        '300ms',
      ]);
    });

    it('appends one extra step when the last screenshot falls between steps', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 100, 250), {
        intervalMs: 100,
      });
      expect(displayMsOf(frames)).toEqual([0, 100, 200, 300]);
    });

    it('is a no-op for a single screenshot', () => {
      const frames = selectFilmStripFrames(shotsAtMs(0), { intervalMs: 100 });
      expect(frames).toHaveLength(1);
      expect(frames[0].syntheticTimestamp).toBeUndefined();
    });

    it.each([0, -50])('treats intervalMs=%s as disabled', (intervalMs) => {
      const frames = selectFilmStripFrames(shotsAtMs(0, 130, 300), {
        intervalMs,
      });
      expect(displayMsOf(frames)).toEqual([0, 130, 300]);
    });
  });

  describe('time range with interval sampling', () => {
    it('runs the timeline from window start to window end, not past it', () => {
      // Regression: an 8400-8600ms window used to sample out to the next real
      // frame at ~9118ms.
      const shots = shotsAtMs(0, 8300, 8450, 9118);
      const frames = selectFilmStripFrames(shots, {
        timeRange: { startMs: 8400, endMs: 8600 },
        intervalMs: 100,
      });

      expect(displayMsOf(frames)).toEqual([8400, 8500, 8600]);
      expect(dataOf(frames)).toEqual(['frame1', 'frame2', 'frame2']);
      expect(frames.map((f) => f.relativeTime)).toEqual([
        '0ms',
        '100ms',
        '200ms',
      ]);
    });
  });
});
