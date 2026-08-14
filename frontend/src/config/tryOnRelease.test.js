import { describe, expect, it, vi } from 'vitest';
import { resolveTryOnRelease } from './tryOnRelease';

function createStorage(existing = null) {
  return {
    getItem: vi.fn(() => existing),
    setItem: vi.fn(),
  };
}

describe('Try-On staged rollout', () => {
  it('honours the emergency kill switch', () => {
    expect(resolveTryOnRelease({
      VITE_TRY_ON_ENABLED: 'false',
      VITE_TRY_ON_ROLLOUT_PERCENT: '100',
    }).enabled).toBe(false);
  });

  it('assigns one anonymous session bucket for percentage rollout', () => {
    const storage = createStorage();
    const release = resolveTryOnRelease(
      { VITE_TRY_ON_ROLLOUT_PERCENT: '10' },
      { storage, randomValue: () => 0.05 },
    );
    expect(release.enabled).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith('try-on-rollout-bucket-v1', '5');
  });

  it('keeps sessions outside the cohort disabled', () => {
    const release = resolveTryOnRelease(
      { VITE_TRY_ON_ROLLOUT_PERCENT: '10', VITE_TRY_ON_RELEASE_CHANNEL: 'invited_pilot' },
      { storage: createStorage('42'), randomValue: () => 0 },
    );
    expect(release).toMatchObject({
      enabled: false,
      rolloutPercent: 10,
      releaseChannel: 'invited_pilot',
    });
  });
});
