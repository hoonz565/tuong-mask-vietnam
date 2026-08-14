export const TRY_ON_STATES = Object.freeze({
  INTRO: 'intro',
  PERMISSION: 'permission',
  LOADING: 'loading',
  CALIBRATING: 'calibrating',
  LIVE: 'live',
  CAPTURING: 'capturing',
  REVIEW: 'review',
  UNSUPPORTED: 'unsupported',
  ERROR: 'error',
});

export const initialTryOnState = {
  value: TRY_ON_STATES.INTRO,
  error: null,
  faceState: 'lost',
  countdown: null,
};

export function tryOnReducer(state, event) {
  switch (event.type) {
    case 'REQUEST_CAMERA':
      return { ...state, value: TRY_ON_STATES.PERMISSION, error: null };
    case 'CAMERA_GRANTED':
      return { ...state, value: TRY_ON_STATES.LOADING, error: null };
    case 'MODELS_READY':
      return { ...state, value: TRY_ON_STATES.CALIBRATING };
    case 'FACE_STATE':
      return {
        ...state,
        faceState: event.faceState,
        value: [TRY_ON_STATES.CAPTURING, TRY_ON_STATES.REVIEW].includes(state.value)
          ? state.value
          : event.faceState === 'tracked' ? TRY_ON_STATES.LIVE : TRY_ON_STATES.CALIBRATING,
      };
    case 'COUNTDOWN':
      return { ...state, value: TRY_ON_STATES.CAPTURING, countdown: event.value };
    case 'CAPTURED':
      return { ...state, value: TRY_ON_STATES.REVIEW, countdown: null };
    case 'RESUME':
      return { ...state, value: TRY_ON_STATES.LIVE, countdown: null };
    case 'UNSUPPORTED':
      return { ...state, value: TRY_ON_STATES.UNSUPPORTED, error: event.error };
    case 'FAIL':
      return { ...state, value: TRY_ON_STATES.ERROR, error: event.error };
    case 'RESET':
      return initialTryOnState;
    default:
      return state;
  }
}
