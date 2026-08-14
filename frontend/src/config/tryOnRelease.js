const BUCKET_KEY = 'try-on-rollout-bucket-v1';

function clampPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, parsed));
}

function getSessionBucket(storage, randomValue) {
  try {
    const storedValue = storage?.getItem(BUCKET_KEY);
    const existing = storedValue === null || storedValue === undefined || storedValue === ''
      ? Number.NaN
      : Number(storedValue);
    if (Number.isFinite(existing) && existing >= 0 && existing < 100) return existing;
    const created = Math.max(0, Math.min(99.9999, randomValue() * 100));
    storage?.setItem(BUCKET_KEY, String(created));
    return created;
  } catch {
    return randomValue() * 100;
  }
}

export function resolveTryOnRelease(
  environment,
  { storage = globalThis.sessionStorage, randomValue = Math.random } = {},
) {
  const explicitlyEnabled = environment.VITE_TRY_ON_ENABLED !== 'false';
  const rolloutPercent = clampPercent(environment.VITE_TRY_ON_ROLLOUT_PERCENT);
  const enabled = explicitlyEnabled && (
    rolloutPercent >= 100
    || (rolloutPercent > 0 && getSessionBucket(storage, randomValue) < rolloutPercent)
  );
  return {
    enabled,
    rolloutPercent,
    releaseChannel: environment.VITE_TRY_ON_RELEASE_CHANNEL || 'technical_pilot',
  };
}
