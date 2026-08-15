import { describe, expect, it } from 'vitest';
import { initialTryOnState, TRY_ON_STATES, tryOnReducer } from './tryOnMachine';

describe('tryOnReducer', () => {
  it('moves through permission, loading, calibration and live states', () => {
    let state = tryOnReducer(initialTryOnState, { type: 'REQUEST_CAMERA' });
    expect(state.value).toBe(TRY_ON_STATES.PERMISSION);
    state = tryOnReducer(state, { type: 'CAMERA_GRANTED' });
    expect(state.value).toBe(TRY_ON_STATES.LOADING);
    state = tryOnReducer(state, { type: 'MODELS_READY' });
    expect(state.value).toBe(TRY_ON_STATES.CALIBRATING);
    state = tryOnReducer(state, { type: 'FACE_STATE', faceState: 'tracked' });
    expect(state.value).toBe(TRY_ON_STATES.LIVE);
  });

  it('enters review only after capture', () => {
    const state = tryOnReducer(initialTryOnState, { type: 'CAPTURED' });
    expect(state.value).toBe(TRY_ON_STATES.REVIEW);
  });

  it('does not let tracking events interrupt capture or review', () => {
    const capturing = { ...initialTryOnState, value: TRY_ON_STATES.CAPTURING };
    const duringCapture = tryOnReducer(capturing, { type: 'FACE_STATE', faceState: 'uncertain' });
    expect(duringCapture.value).toBe(TRY_ON_STATES.CAPTURING);
    const review = { ...duringCapture, value: TRY_ON_STATES.REVIEW };
    expect(tryOnReducer(review, { type: 'FACE_STATE', faceState: 'tracked' }).value).toBe(TRY_ON_STATES.REVIEW);
  });
});
