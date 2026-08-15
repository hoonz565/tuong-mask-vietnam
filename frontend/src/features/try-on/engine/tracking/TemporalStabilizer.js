const DEFAULT_MIN_CUTOFF = 1.35;
const DEFAULT_BETA = 0.035;
const DEFAULT_DERIVATIVE_CUTOFF = 1;

function smoothingFactor(cutoff, deltaSeconds) {
  const ratio = 2 * Math.PI * cutoff * deltaSeconds;
  return ratio / (ratio + 1);
}

function lowPass(value, previous, alpha) {
  return alpha * value + (1 - alpha) * previous;
}

class OneEuroValueFilter {
  constructor({
    minCutoff = DEFAULT_MIN_CUTOFF,
    beta = DEFAULT_BETA,
    derivativeCutoff = DEFAULT_DERIVATIVE_CUTOFF,
  } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.derivativeCutoff = derivativeCutoff;
    this.previousValue = null;
    this.previousDerivative = 0;
    this.previousTimestamp = null;
  }

  filter(value, timestamp) {
    if (this.previousValue === null || this.previousTimestamp === null) {
      this.previousValue = value;
      this.previousTimestamp = timestamp;
      return value;
    }

    const deltaSeconds = Math.max(1 / 240, Math.min(1, (timestamp - this.previousTimestamp) / 1000));
    const derivative = (value - this.previousValue) / deltaSeconds;
    const derivativeAlpha = smoothingFactor(this.derivativeCutoff, deltaSeconds);
    const smoothedDerivative = lowPass(derivative, this.previousDerivative, derivativeAlpha);
    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDerivative);
    const valueAlpha = smoothingFactor(cutoff, deltaSeconds);
    const filtered = lowPass(value, this.previousValue, valueAlpha);

    this.previousValue = filtered;
    this.previousDerivative = smoothedDerivative;
    this.previousTimestamp = timestamp;
    return filtered;
  }
}

function createLandmarkFilter(options) {
  return {
    x: new OneEuroValueFilter(options),
    y: new OneEuroValueFilter(options),
    z: new OneEuroValueFilter(options),
  };
}

export class TemporalStabilizer {
  constructor({ holdMs = 100, fadeMs = 150, filterOptions } = {}) {
    this.holdMs = holdMs;
    this.fadeMs = fadeMs;
    this.filterOptions = filterOptions;
    this.filters = [];
    this.lastLandmarks = null;
    this.lastSeenTimestamp = -Infinity;
    this.explicitlyMissing = false;
  }

  update(landmarks, timestamp) {
    if (!Array.isArray(landmarks) || landmarks.length < 468) {
      return this.markMissing(timestamp);
    }

    if (this.filters.length !== landmarks.length) {
      this.filters = landmarks.map(() => createLandmarkFilter(this.filterOptions));
    }

    this.lastLandmarks = landmarks.map((landmark, index) => ({
      x: this.filters[index].x.filter(landmark.x, timestamp),
      y: this.filters[index].y.filter(landmark.y, timestamp),
      z: this.filters[index].z.filter(landmark.z || 0, timestamp),
    }));
    this.lastSeenTimestamp = timestamp;
    this.explicitlyMissing = false;

    return { state: 'tracked', alpha: 1, landmarks: this.lastLandmarks };
  }

  markMissing(timestamp) {
    this.explicitlyMissing = true;
    return this.missingState(timestamp);
  }

  missingState(timestamp) {
    const elapsed = timestamp - this.lastSeenTimestamp;
    if (!this.lastLandmarks || elapsed > this.holdMs + this.fadeMs) {
      return { state: 'lost', alpha: 0, landmarks: null };
    }
    if (elapsed <= this.holdMs) {
      return { state: 'uncertain', alpha: 1, landmarks: this.lastLandmarks };
    }

    const fadeProgress = (elapsed - this.holdMs) / this.fadeMs;
    return {
      state: 'uncertain',
      alpha: Math.max(0, 1 - fadeProgress),
      landmarks: this.lastLandmarks,
    };
  }

  getState(timestamp) {
    const elapsed = timestamp - this.lastSeenTimestamp;
    if (!this.explicitlyMissing && this.lastLandmarks && elapsed <= this.holdMs) {
      return { state: 'tracked', alpha: 1, landmarks: this.lastLandmarks };
    }
    return this.missingState(timestamp);
  }

  reset() {
    this.filters = [];
    this.lastLandmarks = null;
    this.lastSeenTimestamp = -Infinity;
    this.explicitlyMissing = false;
  }
}
