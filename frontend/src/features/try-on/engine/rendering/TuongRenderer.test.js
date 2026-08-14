import { describe, expect, it } from 'vitest';
import { calculateCoverTransform, landmarkToClip } from './TuongRenderer';

describe('renderer coordinate transforms', () => {
  it('calculates object-cover crop for landscape video', () => {
    const cover = calculateCoverTransform(1920, 1080, 1080, 1080);
    expect(cover.cropX).toBeCloseTo(0.5625);
    expect(cover.cropY).toBe(1);
  });

  it('mirrors only the display coordinate', () => {
    const point = { x: 0.25, y: 0.5 };
    expect(landmarkToClip(point, { cropX: 1, cropY: 1 }, false)).toMatchObject({ x: -0.5, y: 0 });
    expect(landmarkToClip(point, { cropX: 1, cropY: 1 }, true)).toMatchObject({ x: 0.5, y: 0 });
  });
});
