import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { calculateGalleryCrop, findOpaqueBounds, parseCanonicalObj } from './TemplateLoader';

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

  it('requires every pilot atlas to expose real semantic SVG groups', () => {
    const templateRoot = fileURLToPath(new URL('../../../../../public/try-on/templates', import.meta.url));
    const atlasPaths = [
      'ac_ba/v1/atlas.svg',
      'bao_cong/v1/atlas.svg',
      'dao_tam_xuan/v1/atlas.svg',
      'khong_minh/v1/atlas.svg',
      'ly_phung_dinh_blue/v1/atlas.svg',
      'quan_cong/v1/atlas.svg',
      'tao_thao/v1/atlas.svg',
      'truong_phi/v1/atlas.svg',
    ];
    for (const relativePath of atlasPaths) {
      const source = readFileSync(`${templateRoot}/${relativePath}`, 'utf8');
      expect(source).toContain('id="layer-base"');
      expect(source).toContain('id="layer-eyes"');
      expect(source).toContain('id="layer-mouth"');
    }
  });
});

describe('gallery texture registration', () => {
  it('finds the non-transparent source artwork bounds', () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4);
    pixels[(1 * 4 + 1) * 4 + 3] = 255;
    pixels[(2 * 4 + 3) * 4 + 3] = 255;
    expect(findOpaqueBounds({ data: pixels, width: 4, height: 4 }))
      .toEqual({ x: 1, y: 1, width: 3, height: 2 });
  });

  it('focuses tall costume artwork on its upper face-bearing section', () => {
    const crop = calculateGalleryCrop(
      { x: 273, y: 85, width: 535, height: 1180 },
      1080,
      1350,
    );
    expect(crop.height).toBeCloseTo(802.5);
    expect(crop.y).toBeGreaterThan(85);
    expect(crop.y + crop.height).toBeLessThanOrEqual(1350);
  });
});
