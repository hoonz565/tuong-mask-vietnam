const LEFT_EYE_PAIRS = [[159, 145], [158, 153], [160, 144]];
const RIGHT_EYE_PAIRS = [[386, 374], [385, 380], [387, 373]];
const LOWER_MOUTH = [17, 84, 181, 91, 146, 314, 405, 321, 375];
const LOWER_JAW = [152, 148, 176, 149, 150, 136, 365, 379, 400, 377];
const BROWS = [63, 66, 70, 105, 107, 293, 296, 300, 334, 336];

export const PROTECTED_FIXTURE_ANCHORS = Object.freeze([
  33, 133, 159, 145, 263, 362, 386, 374,
  61, 291, 13, 14, 17, 0,
]);

function normalize(values, value, low, span) {
  const minimum = Math.min(...values);
  const range = Math.max(1e-9, Math.max(...values) - minimum);
  return low + ((value - minimum) / range) * span;
}

export function canonicalLandmarksFromObj(source) {
  const vertices = source.split(/\r?\n/)
    .filter((line) => line.startsWith('v '))
    .slice(0, 468)
    .map((line) => line.trim().split(/\s+/).slice(1, 4).map(Number));
  if (vertices.length !== 468 || vertices.some((point) => point.some((value) => !Number.isFinite(value)))) {
    throw new Error('Fixture matrix requires exactly 468 finite canonical vertices.');
  }
  const xs = vertices.map(([x]) => x);
  const ys = vertices.map(([, y]) => y);
  const zs = vertices.map(([, , z]) => z);
  return vertices.map(([x, y, z]) => ({
    x: normalize(xs, x, 0.18, 0.64),
    y: 0.88 - normalize(ys, y, 0, 0.76),
    z: normalize(zs, z, -0.5, 1),
  }));
}

function cloneLandmarks(landmarks) {
  return landmarks.map((point) => ({ ...point }));
}

function blink(landmarks) {
  const next = cloneLandmarks(landmarks);
  for (const [upperIndex, lowerIndex] of [...LEFT_EYE_PAIRS, ...RIGHT_EYE_PAIRS]) {
    const upper = next[upperIndex];
    const lower = next[lowerIndex];
    const midpoint = (upper.y + lower.y) / 2;
    const remainingGap = Math.abs(lower.y - upper.y) * 0.08;
    upper.y = midpoint - remainingGap;
    lower.y = midpoint + remainingGap;
  }
  return next;
}

function smile(landmarks) {
  const next = cloneLandmarks(landmarks);
  next[61].x -= 0.012;
  next[61].y -= 0.008;
  next[291].x += 0.012;
  next[291].y -= 0.008;
  [0, 13, 14, 17, 78, 308].forEach((index) => { next[index].y -= 0.004; });
  return next;
}

function jawOpen(landmarks) {
  const next = cloneLandmarks(landmarks);
  LOWER_MOUTH.forEach((index) => { next[index].y += 0.025; });
  LOWER_JAW.forEach((index) => { next[index].y += 0.018; });
  return next;
}

function browRaise(landmarks) {
  const next = cloneLandmarks(landmarks);
  BROWS.forEach((index) => { next[index].y -= 0.012; });
  return next;
}

function yaw(landmarks, direction) {
  return landmarks.map((point) => ({
    ...point,
    x: 0.5 + (point.x - 0.5) * 0.84 + direction * point.z * 0.01,
  }));
}

function pitch(landmarks, direction) {
  return landmarks.map((point) => ({
    ...point,
    y: 0.5 + (point.y - 0.5) * 0.9 + direction * point.z * 0.005,
  }));
}

export function createTemplateFixtureMatrix(canonicalLandmarks, poseLimits) {
  return [
    { id: 'neutral', landmarks: cloneLandmarks(canonicalLandmarks), pose: { yaw: 0, pitch: 0, roll: 0 } },
    { id: 'blink', landmarks: blink(canonicalLandmarks), pose: { yaw: 0, pitch: 0, roll: 0 } },
    { id: 'smile', landmarks: smile(canonicalLandmarks), pose: { yaw: 0, pitch: 0, roll: 0 } },
    { id: 'jaw_open', landmarks: jawOpen(canonicalLandmarks), pose: { yaw: 0, pitch: 0, roll: 0 } },
    { id: 'brow_raise', landmarks: browRaise(canonicalLandmarks), pose: { yaw: 0, pitch: 0, roll: 0 } },
    { id: 'yaw_left', landmarks: yaw(canonicalLandmarks, -1), pose: { yaw: -poseLimits.yaw, pitch: 0, roll: 0 } },
    { id: 'yaw_right', landmarks: yaw(canonicalLandmarks, 1), pose: { yaw: poseLimits.yaw, pitch: 0, roll: 0 } },
    { id: 'pitch_up', landmarks: pitch(canonicalLandmarks, -1), pose: { yaw: 0, pitch: -poseLimits.pitch, roll: 0 } },
    { id: 'pitch_down', landmarks: pitch(canonicalLandmarks, 1), pose: { yaw: 0, pitch: poseLimits.pitch, roll: 0 } },
  ];
}
