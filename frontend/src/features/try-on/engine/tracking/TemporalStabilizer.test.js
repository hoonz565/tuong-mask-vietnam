import { describe, expect, it } from 'vitest';
import { TemporalStabilizer } from './TemporalStabilizer';

function face(value = 0.5) {
  return Array.from({ length: 478 }, () => ({ x: value, y: value, z: 0 }));
}

describe('TemporalStabilizer', () => {
  it('tracks dense landmarks then holds, fades and loses them', () => {
    const stabilizer = new TemporalStabilizer({ holdMs: 100, fadeMs: 150 });
    expect(stabilizer.update(face(), 0).state).toBe('tracked');
    expect(stabilizer.getState(80)).toMatchObject({ state: 'tracked', alpha: 1 });
    expect(stabilizer.getState(175).alpha).toBeCloseTo(0.5);
    expect(stabilizer.getState(251)).toMatchObject({ state: 'lost', alpha: 0, landmarks: null });
  });

  it('rejects a sparse landmark result', () => {
    const stabilizer = new TemporalStabilizer();
    expect(stabilizer.update([{ x: 0, y: 0 }], 0).state).toBe('lost');
  });

  it('enters uncertain immediately after an explicit missing result', () => {
    const stabilizer = new TemporalStabilizer();
    stabilizer.update(face(), 0);
    expect(stabilizer.update([], 20).state).toBe('uncertain');
  });
});
