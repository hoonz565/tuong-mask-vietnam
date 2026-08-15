import { describe, expect, it } from 'vitest';
import { estimatePoseFromMatrix } from './pose';

describe('estimatePoseFromMatrix', () => {
  it('maps an identity transform to a frontal pose', () => {
    const pose = estimatePoseFromMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    expect(pose).toMatchObject({ yaw: -0, pitch: 0, roll: 0 });
  });

  it('extracts yaw from a column-major Y rotation', () => {
    const angle = 30 * Math.PI / 180;
    const matrix = [
      Math.cos(angle), 0, -Math.sin(angle), 0,
      0, 1, 0, 0,
      Math.sin(angle), 0, Math.cos(angle), 0,
      0, 0, 0, 1,
    ];
    expect(estimatePoseFromMatrix(matrix).yaw).toBeCloseTo(30);
  });
});
