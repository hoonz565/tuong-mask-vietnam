function averagePoint(landmarks, indices) {
  const sum = indices.reduce(
    (accumulator, index) => ({
      x: accumulator.x + landmarks[index].x,
      y: accumulator.y + landmarks[index].y,
    }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / indices.length, y: sum.y / indices.length };
}

export function estimatePose(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const nose = landmarks[1];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftEye = averagePoint(landmarks, [33, 133]);
  const rightEye = averagePoint(landmarks, [362, 263]);

  const faceWidth = Math.max(0.001, Math.abs(rightCheek.x - leftCheek.x));
  const faceHeight = Math.max(0.001, Math.abs(chin.y - forehead.y));
  const faceMidX = (leftCheek.x + rightCheek.x) / 2;
  const expectedNoseY = forehead.y + faceHeight * 0.56;

  const yaw = Math.max(-60, Math.min(60, ((nose.x - faceMidX) / faceWidth) * 150));
  const pitch = Math.max(-45, Math.min(45, ((nose.y - expectedNoseY) / faceHeight) * 120));
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return { yaw, pitch, roll };
}

export function estimatePoseFromMatrix(matrix) {
  if (!matrix || matrix.length < 16) return null;
  // MediaPipe exposes an OpenGL-style column-major 4×4 facial transform.
  const r00 = matrix[0];
  const r10 = matrix[1];
  const r20 = matrix[2];
  const r21 = matrix[6];
  const r22 = matrix[10];
  if (![r00, r10, r20, r21, r22].every(Number.isFinite)) return null;

  const toDegrees = 180 / Math.PI;
  return {
    yaw: Math.asin(Math.max(-1, Math.min(1, -r20))) * toDegrees,
    pitch: Math.atan2(r21, r22) * toDegrees,
    roll: Math.atan2(r10, r00) * toDegrees,
  };
}

export function createFaceRoi(landmarks, padding = 0.18) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return null;
  const xs = landmarks.slice(0, 468).map((landmark) => landmark.x);
  const ys = landmarks.slice(0, 468).map((landmark) => landmark.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  minX = Math.max(0, minX - width * padding);
  maxX = Math.min(1, maxX + width * padding);
  minY = Math.max(0, minY - height * padding);
  maxY = Math.min(1, maxY + height * padding);

  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  };
}
