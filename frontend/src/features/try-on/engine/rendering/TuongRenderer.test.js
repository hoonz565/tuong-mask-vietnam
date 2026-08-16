import { describe, expect, it } from 'vitest';
import {
  buildMeshFrameData,
  calculateCoverTransform,
  createReprojectedParseUvs,
  layerUsesSemanticParsing,
  landmarkToClip,
} from './TuongRenderer';

describe('renderer coordinate transforms', () => {
  it('calculates object-cover crop for landscape video', () => {
    const cover = calculateCoverTransform(1920, 1080, 1080, 1080);
    expect(cover.cropX).toBeCloseTo(0.5625);
    expect(cover.cropY).toBe(1);
  });

  it('mirrors only the display coordinate', () => {
    const point = { x: 0.25, y: 0.5 };
    expect(landmarkToClip(point, { cropX: 1, cropY: 1 }, false)).toMatchObject({ x: -0.5, y: 0 });
    expect(landmarkToClip(point, { cropX: 1, cropY: 1 }, true)).toMatchObject({ x: 0.5, y: 0 });
  });

  it('binds parser pixels to request-time mesh vertices for temporal reprojection', () => {
    const mesh = { vertexIndices: Uint16Array.from([0, 1, 2]) };
    const landmarks = [
      { x: 0.25, y: 0.3 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.7 },
    ];
    const uvs = createReprojectedParseUvs(mesh, landmarks, {
      x: 0.2, y: 0.2, width: 0.6, height: 0.6,
    });
    expect(Array.from(uvs)).toEqual([
      expect.closeTo(1 / 12), expect.closeTo(1 / 6),
      expect.closeTo(0.5), expect.closeTo(0.5),
      expect.closeTo(11 / 12), expect.closeTo(5 / 6),
    ]);
  });

  it('keeps flat gallery artwork bounded by the face mesh instead of fragmenting it', () => {
    expect(layerUsesSemanticParsing({ occlusion_policy: 'face_mesh' })).toBe(false);
    expect(layerUsesSemanticParsing({ occlusion_policy: 'semantic_face' })).toBe(true);
  });

  it('culls inverted and pathologically stretched triangles before drawing', () => {
    const mesh = {
      vertexIndices: Uint16Array.from([0, 1, 2, 3, 4, 5]),
      uvCoordinates: Float32Array.from([
        0, 0, 1, 0, 0, 1,
        0, 0, 1, 0, 0, 1,
      ]),
    };
    const landmarks = [
      { x: 0.2, y: 0.2 }, { x: 0.3, y: 0.2 }, { x: 0.2, y: 0.3 },
      { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.2001, y: 0.20001 },
    ];
    const frame = buildMeshFrameData(
      mesh,
      landmarks,
      { cropX: 1, cropY: 1 },
      { yaw: 0, pitch: 0, roll: 0 },
      true,
    );
    expect(frame.stableTriangleCount).toBe(0);
    expect(Array.from(frame.visibility)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(frame.orientationCulledTriangleCount).toBe(1);
  });
});
