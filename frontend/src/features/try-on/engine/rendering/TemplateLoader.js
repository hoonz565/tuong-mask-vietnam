import { loadTryOnTextAsset, validateTryOnTemplate } from '../../../../api/tryOnService';

const DEFAULT_CANONICAL_MESH_PATH = '/try-on/mesh/canonical_face_model.obj';
const ATLAS_SIZE = 1024;
const LAYER_GROUP_BY_ID = Object.freeze({
  base: 'layer-base',
  eye_motifs: 'layer-eyes',
  mouth: 'layer-mouth',
});

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

async function rasterizeSvgLayer(source, groupId, path) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, 'image/svg+xml');
  if (documentNode.querySelector('parsererror')) {
    throw new Error(`Invalid Try-On SVG texture: ${path}`);
  }

  const layerGroups = Array.from(documentNode.querySelectorAll('g[id^="layer-"]'));
  const selectedLayer = layerGroups.find((group) => group.id === groupId);
  if (!selectedLayer) {
    throw new Error(`Try-On texture ${path} is missing semantic group #${groupId}.`);
  }
  layerGroups.forEach((group) => {
    if (group !== selectedLayer) group.remove();
  });

  const serialized = new XMLSerializer().serializeToString(documentNode.documentElement);
  const objectUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml' }));
  try {
    const image = await loadImage(objectUrl);
    return rasterizeAtlas(image, `${path}#${groupId}`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadLayeredAtlas(path, expectedSha256, layers) {
  return loadTryOnTextAsset(path, expectedSha256).then((source) => Promise.all(layers.map(async (layer) => {
    const groupId = layer.svg_group || LAYER_GROUP_BY_ID[layer.id];
    if (!groupId) throw new Error(`Try-On layer ${layer.id} has no SVG group binding.`);
    return {
      ...layer,
      svg_group: groupId,
      image: await rasterizeSvgLayer(source, groupId, path),
    };
  })));
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
        loadLayeredAtlas(validated.atlas_url, validated.asset_sha256, validated.layers),
      );
    }

    const [mesh, layers] = await Promise.all([
      this.loadMesh(),
      this.textureCache.get(validated.atlas_url),
    ]);

    return { template: validated, mesh, layers };
  }

  clear() {
    this.textureCache.clear();
    this.meshPromise = null;
  }
}
