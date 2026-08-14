import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseCanonicalObj } from './TemplateLoader';

describe('parseCanonicalObj', () => {
  it('loads MediaPipe canonical UV topology', () => {
    const path = fileURLToPath(new URL('../../../../../public/try-on/mesh/canonical_face_model.obj', import.meta.url));
    const mesh = parseCanonicalObj(readFileSync(path, 'utf8'));
    expect(mesh.triangleCount).toBeGreaterThan(800);
    expect(mesh.vertexIndices.length).toBe(mesh.uvCoordinates.length / 2);
    expect(Math.max(...mesh.vertexIndices)).toBeLessThan(468);
  });

  it('refuses non-triangulated topology', () => {
    expect(() => parseCanonicalObj('vt 0 0\nvt 1 0\nvt 1 1\nvt 0 1\nf 1/1 2/2 3/3 4/4'))
      .toThrow('must be triangulated');
  });
});
