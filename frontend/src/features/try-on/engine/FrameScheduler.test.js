import { describe, expect, it } from 'vitest';
import { FrameScheduler, PerformanceTracker } from './FrameScheduler';

describe('FrameScheduler', () => {
  it('enforces cadence and one unresolved inference', () => {
    const scheduler = new FrameScheduler({ landmarkInterval: 30, parserInterval: 100 });
    expect(scheduler.beginLandmarks(0)).toBe(true);
    expect(scheduler.beginLandmarks(40)).toBe(false);
    expect(scheduler.finishLandmarks(0)).toBe(true);
    expect(scheduler.beginLandmarks(29)).toBe(false);
    expect(scheduler.beginLandmarks(30)).toBe(true);
  });

  it('drops results that arrive out of order', () => {
    const scheduler = new FrameScheduler();
    scheduler.beginLandmarks(100);
    expect(scheduler.finishLandmarks(100)).toBe(true);
    scheduler.landmarkBusy = true;
    expect(scheduler.finishLandmarks(90)).toBe(false);
  });

  it('reports rolling median and p95', () => {
    const tracker = new PerformanceTracker(5);
    [1, 2, 3, 4, 100].forEach((value) => tracker.record('latency', value));
    expect(tracker.summary().latency).toMatchObject({ median: 3, p95: 100, count: 5 });
  });

  it('records event cadence without inventing a first sample', () => {
    const tracker = new PerformanceTracker();
    tracker.recordRate('parser_hz', 100);
    tracker.recordRate('parser_hz', 200);
    tracker.recordRate('parser_hz', 325);
    expect(tracker.summary().parser_hz).toMatchObject({ count: 2 });
    expect(tracker.summary().parser_hz.median).toBeCloseTo(10);
  });
});
