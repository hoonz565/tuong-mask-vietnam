const DEFAULT_LANDMARK_INTERVAL = 1000 / 30;
const DEFAULT_PARSER_INTERVAL = 1000 / 10;

export class FrameScheduler {
  constructor({
    landmarkInterval = DEFAULT_LANDMARK_INTERVAL,
    parserInterval = DEFAULT_PARSER_INTERVAL,
  } = {}) {
    this.landmarkInterval = landmarkInterval;
    this.parserInterval = parserInterval;
    this.landmarkBusy = false;
    this.parserBusy = false;
    this.lastLandmarkRequest = -Infinity;
    this.lastParserRequest = -Infinity;
    this.lastLandmarkResult = -Infinity;
    this.lastParserResult = -Infinity;
  }

  shouldRequestLandmarks(timestamp) {
    return !this.landmarkBusy && timestamp - this.lastLandmarkRequest >= this.landmarkInterval;
  }

  shouldRequestParser(timestamp) {
    return !this.parserBusy && timestamp - this.lastParserRequest >= this.parserInterval;
  }

  beginLandmarks(timestamp) {
    if (!this.shouldRequestLandmarks(timestamp)) return false;
    this.landmarkBusy = true;
    this.lastLandmarkRequest = timestamp;
    return true;
  }

  beginParser(timestamp) {
    if (!this.shouldRequestParser(timestamp)) return false;
    this.parserBusy = true;
    this.lastParserRequest = timestamp;
    return true;
  }

  finishLandmarks(timestamp) {
    this.landmarkBusy = false;
    if (timestamp <= this.lastLandmarkResult) return false;
    this.lastLandmarkResult = timestamp;
    return true;
  }

  finishParser(timestamp) {
    this.parserBusy = false;
    if (timestamp <= this.lastParserResult) return false;
    this.lastParserResult = timestamp;
    return true;
  }

  failLandmarks() {
    this.landmarkBusy = false;
  }

  failParser() {
    this.parserBusy = false;
  }

  setParserCadence(hertz) {
    const safeHertz = Math.max(1, Math.min(15, hertz));
    this.parserInterval = 1000 / safeHertz;
  }

  reset() {
    this.landmarkBusy = false;
    this.parserBusy = false;
    this.lastLandmarkRequest = -Infinity;
    this.lastParserRequest = -Infinity;
    this.lastLandmarkResult = -Infinity;
    this.lastParserResult = -Infinity;
  }
}

export class PerformanceTracker {
  constructor(sampleLimit = 120) {
    this.sampleLimit = sampleLimit;
    this.samples = new Map();
    this.lastRenderTimestamp = null;
  }

  record(name, value) {
    const values = this.samples.get(name) || [];
    values.push(value);
    if (values.length > this.sampleLimit) values.shift();
    this.samples.set(name, values);
  }

  recordRender(timestamp) {
    if (this.lastRenderTimestamp !== null) {
      const delta = timestamp - this.lastRenderTimestamp;
      if (delta > 0 && delta < 1000) this.record('render_fps', 1000 / delta);
    }
    this.lastRenderTimestamp = timestamp;
  }

  summary() {
    const summary = {};
    for (const [name, values] of this.samples) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
      summary[name] = {
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[p95Index],
        count: sorted.length,
      };
    }
    return summary;
  }
}
