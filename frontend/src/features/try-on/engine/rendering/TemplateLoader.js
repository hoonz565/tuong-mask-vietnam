import { loadTryOnTextAsset, validateTryOnTemplate } from '../../../../api/tryOnService';

const DEFAULT_CANONICAL_MESH_PATH = '/try-on/mesh/canonical_face_model.obj';
const ATLAS_SIZE = 1024;

export function parseCanonicalObj(source) {
  const textureCoordinates = [];
  const vertexIndices = [];
  const uvCoordinates = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('vt ')) {
      const [, u, v] = line.split(/\s+/);
      textureCoordinates.push([Number(u), Number(v)]);
      continue;
    }

    if (!line.startsWith('f ')) continue;
    const corners = line.slice(2).trim().split(/\s+/);
    if (corners.length !== 3) {
      throw new Error('Canonical face mesh must be triangulated.');
    }

    for (const corner of corners) {
      const [vertexIndex, textureIndex] = corner.split('/').map(Number);
      if (!vertexIndex || !textureIndex) {
        throw new Error(`Invalid canonical mesh face corner: ${corner}`);
      }

      const uv = textureCoordinates[textureIndex - 1];
      if (!uv) {
        throw new Error(`Missing texture coordinate ${textureIndex}.`);
      }
      vertexIndices.push(vertexIndex - 1);
      uvCoordinates.push(uv[0], uv[1]);
    }
  }

  if (vertexIndices.length === 0 || vertexIndices.length !== uvCoordinates.length / 2) {
    throw new Error('Canonical face mesh contains no usable triangles.');
  }

  const maxVertexIndex = Math.max(...vertexIndices);
  if (maxVertexIndex >= 468) {
    throw new Error(`Canonical mesh references unsupported landmark ${maxVertexIndex}.`);
  }

  return {
    vertexIndices: Uint16Array.from(vertexIndices),
    uvCoordinates: Float32Array.from(uvCoordinates),
    triangleCount: vertexIndices.length / 3,
  };
}

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load Try-On texture: ${path}`));
    image.src = path;
  });
}

function rasterizeAtlas(image, path) {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(`Unable to rasterize Try-On texture: ${path}`);
  context.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  context.drawImage(image, 0, 0, ATLAS_SIZE, ATLAS_SIZE);
  return canvas;
}

export class TemplateLoader {
  constructor({ meshPath = DEFAULT_CANONICAL_MESH_PATH } = {}) {
    this.meshPath = meshPath;
    this.meshPromise = null;
    this.textureCache = new Map();
  }

  async loadMesh() {
    if (!this.meshPromise) {
      this.meshPromise = loadTryOnTextAsset(this.meshPath).then(parseCanonicalObj);
    }
    return this.meshPromise;
  }

  async loadTemplate(template) {
    const validated = validateTryOnTemplate(template);
    if (!this.textureCache.has(validated.atlas_url)) {
      // SVG without explicit dimensions defaults to 300x150 in an Image element.
      // Rasterize every atlas into its canonical square before WebGL upload so UVs
      // and fine Tuong motifs remain stable across browsers.
      this.textureCache.set(
        validated.atlas_url,
        loadImage(validated.atlas_url).then((image) => rasterizeAtlas(image, validated.atlas_url)),
      );
    }

    const [mesh, image] = await Promise.all([
      this.loadMesh(),
      this.textureCache.get(validated.atlas_url),
    ]);

    return { template: validated, mesh, image };
  }

  clear() {
    this.textureCache.clear();
    this.meshPromise = null;
  }
}
