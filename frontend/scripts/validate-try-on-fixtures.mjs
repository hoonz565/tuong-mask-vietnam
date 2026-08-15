import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildMeshFrameData,
  poseOpacity,
} from '../src/features/try-on/engine/rendering/TuongRenderer.js';
import {
  canonicalLandmarksFromObj,
  createTemplateFixtureMatrix,
  PROTECTED_FIXTURE_ANCHORS,
} from '../src/features/try-on/engine/testing/fixtureMatrix.js';

const meshPath = fileURLToPath(new URL('../public/try-on/mesh/canonical_face_model.obj', import.meta.url));
const manifestPath = fileURLToPath(new URL('../../backend/try_on_templates.json', import.meta.url));

function parseMesh(source) {
  const textureCoordinates = [];
  const vertexIndices = [];
  const uvCoordinates = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('vt ')) {
      const [, u, v] = line.split(/\s+/);
      textureCoordinates.push([Number(u), Number(v)]);
    } else if (line.startsWith('f ')) {
      for (const corner of line.slice(2).trim().split(/\s+/)) {
        const [vertexIndex, textureIndex] = corner.split('/').map(Number);
        vertexIndices.push(vertexIndex - 1);
        uvCoordinates.push(...textureCoordinates[textureIndex - 1]);
      }
    }
  }
  return {
    vertexIndices: Uint16Array.from(vertexIndices),
    uvCoordinates: Float32Array.from(uvCoordinates),
  };
}

function signedTriangleAreas(positions) {
  const areas = [];
  for (let index = 0; index < positions.length; index += 6) {
    areas.push(
      (positions[index + 2] - positions[index]) * (positions[index + 5] - positions[index + 1])
      - (positions[index + 4] - positions[index]) * (positions[index + 3] - positions[index + 1]),
    );
  }
  return areas;
}

const source = readFileSync(meshPath, 'utf8');
const mesh = parseMesh(source);
const canonicalLandmarks = canonicalLandmarksFromObj(source);
const { templates } = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cover = { cropX: 1, cropY: 1 };
const mirrorModes = [true, false];
const neutralSignsByMirror = new Map(mirrorModes.map((mirror) => {
  const frame = buildMeshFrameData(
    mesh,
    canonicalLandmarks,
    cover,
    { yaw: 0, pitch: 0, roll: 0 },
    mirror,
  );
  return [mirror, signedTriangleAreas(frame.positions)];
}));
const failures = [];
const results = [];

for (const template of templates) {
  const fixtures = createTemplateFixtureMatrix(canonicalLandmarks, template.pose_limits);
  for (const fixture of fixtures) {
    for (const mirror of mirrorModes) {
    const frame = buildMeshFrameData(mesh, fixture.landmarks, cover, fixture.pose, mirror);
    const areas = signedTriangleAreas(frame.positions);
    const neutralSigns = neutralSignsByMirror.get(mirror);
    const visibleAdditionalInversions = areas.filter((area, index) => (
      Math.abs(area) > 1e-8
      && Math.abs(neutralSigns[index]) > 1e-8
      && Math.sign(area) !== Math.sign(neutralSigns[index])
      && frame.visibility[index * 3] > 0
    )).length;
    const finite = [...frame.positions, ...frame.visibility].every(Number.isFinite);
    const protectedAnchorsFinite = PROTECTED_FIXTURE_ANCHORS.every((index) => {
      const point = fixture.landmarks[index];
      return Number.isFinite(point?.x) && Number.isFinite(point?.y);
    });
    const stableRatio = frame.stableTriangleCount / frame.triangleCount;
    const opacity = poseOpacity(fixture.pose, template.pose_limits);
    const fadedVertexCount = [...frame.visibility].filter((value) => value > 0 && value < 1).length;
    const isYawFixture = fixture.id.startsWith('yaw_');
    const passed = finite
      && protectedAnchorsFinite
      && stableRatio >= 0.97
      && visibleAdditionalInversions === 0
      && opacity > 0
      && opacity <= 1
      && (!isYawFixture || fadedVertexCount > 0);
    const result = {
      template: template.id,
      fixture: fixture.id,
      mirror,
      stableTriangleRatio: Number(stableRatio.toFixed(6)),
      visibleAdditionalInversions,
      orientationCulledTriangleCount: frame.orientationCulledTriangleCount,
      opacity: Number(opacity.toFixed(6)),
      fadedVertexCount,
      passed,
    };
    results.push(result);
    if (!passed) failures.push(result);
    }
  }
}

const summary = {
  status: failures.length === 0 ? 'pass' : 'fail',
  templateCount: templates.length,
  fixtureCountPerTemplate: results.length / templates.length,
  totalChecks: results.length,
  minimumStableTriangleRatio: Math.min(...results.map((result) => result.stableTriangleRatio)),
  maximumVisibleAdditionalInversions: Math.max(...results.map((result) => result.visibleAdditionalInversions)),
  maximumOrientationCulledTriangles: Math.max(...results.map((result) => result.orientationCulledTriangleCount)),
  failedChecks: failures,
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0) process.exitCode = 1;
