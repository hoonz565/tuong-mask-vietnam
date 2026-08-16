import { loadTryOnTextAsset, validateTryOnTemplate } from '../../../../api/tryOnService';

const DEFAULT_CANONICAL_MESH_PATH = '/try-on/mesh/canonical_face_model.obj';
const ATLAS_SIZE = 1024;
const MAX_CACHED_TEXTURES = 12;
const GALLERY_EYE_CUTOUT_PROFILE = Object.freeze([
  Object.freeze({ centerX: 0.34445, centerY: 0.37851, innerRadiusX: 0.108, innerRadiusY: 0.052, outerRadiusX: 0.145, outerRadiusY: 0.084 }),
  Object.freeze({ centerX: 0.65556, centerY: 0.37851, innerRadiusX: 0.108, innerRadiusY: 0.052, outerRadiusX: 0.145, outerRadiusY: 0.084 }),
]);
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

export function findOpaqueBounds(imageData, alphaThreshold = 8) {
  const { data, width, height } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return right >= left && bottom >= top
    ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
    : { x: 0, y: 0, width, height };
}

export function calculateGalleryCrop(bounds, imageWidth, imageHeight) {
  const crop = { ...bounds };
  const aspect = crop.height / Math.max(1, crop.width);

  // A few archive images include an entire headdress/costume. Keep the face-
  // bearing upper section instead of compressing the full costume into a face.
  if (aspect > 1.65) {
    const targetHeight = Math.min(crop.height, crop.width * 1.5);
    const excess = crop.height - targetHeight;
    crop.y += excess * 0.14;
    crop.height = targetHeight;
  }

  crop.x = Math.max(0, crop.x);
  crop.y = Math.max(0, crop.y);
  crop.width = Math.min(crop.width, imageWidth - crop.x);
  crop.height = Math.min(crop.height, imageHeight - crop.y);
  return crop;
}

export function calculateGalleryEyeCutouts(size = ATLAS_SIZE) {
  return GALLERY_EYE_CUTOUT_PROFILE.map((cutout) => ({
    centerX: cutout.centerX * size,
    centerY: cutout.centerY * size,
    innerRadiusX: cutout.innerRadiusX * size,
    innerRadiusY: cutout.innerRadiusY * size,
    outerRadiusX: cutout.outerRadiusX * size,
    outerRadiusY: cutout.outerRadiusY * size,
  }));
}

function applyGalleryEyeCutouts(context, size = ATLAS_SIZE) {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  for (const cutout of calculateGalleryEyeCutouts(size)) {
    context.save();
    context.translate(cutout.centerX, cutout.centerY);
    context.scale(1, cutout.outerRadiusY / cutout.outerRadiusX);
    const innerRatio = cutout.innerRadiusX / cutout.outerRadiusX;
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, cutout.outerRadiusX);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(innerRatio, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, cutout.outerRadiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.restore();
}

function rasterizeGalleryImage(image, path) {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.naturalWidth || image.width;
  sourceCanvas.height = image.naturalHeight || image.height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error(`Unable to inspect Try-On gallery texture: ${path}`);
  sourceContext.drawImage(image, 0, 0);

  const bounds = findOpaqueBounds(
    sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
  );
  const crop = calculateGalleryCrop(bounds, sourceCanvas.width, sourceCanvas.height);
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(`Unable to rasterize Try-On gallery texture: ${path}`);

  const scale = Math.min(ATLAS_SIZE / crop.width, ATLAS_SIZE / crop.height) * 0.96;
  const destinationWidth = crop.width * scale;
  const destinationHeight = crop.height * scale;
  const destinationX = (ATLAS_SIZE - destinationWidth) / 2;
  const destinationY = (ATLAS_SIZE - destinationHeight) / 2;
  context.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  );
  applyGalleryEyeCutouts(context);
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

async function loadGalleryAtlas(path, layers) {
  const image = await loadImage(path);
  const atlas = rasterizeGalleryImage(image, path);
  return layers.map((layer) => ({ ...layer, image: atlas }));
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
    const textureKey = validated.texture_source === 'gallery_image'
      ? validated.source_image_url
      : validated.atlas_url;
    if (!this.textureCache.has(textureKey)) {
      // SVG without explicit dimensions defaults to 300x150 in an Image element.
      // Rasterize every atlas into its canonical square before WebGL upload so UVs
      // and fine Tuong motifs remain stable across browsers.
      const texturePromise = validated.texture_source === 'gallery_image'
        ? loadGalleryAtlas(validated.source_image_url, validated.layers)
        : loadLayeredAtlas(validated.atlas_url, validated.asset_sha256, validated.layers);
      this.textureCache.set(textureKey, texturePromise);
      texturePromise.catch(() => this.textureCache.delete(textureKey));
      if (this.textureCache.size > MAX_CACHED_TEXTURES) {
        const oldestKey = this.textureCache.keys().next().value;
        if (oldestKey !== textureKey) this.textureCache.delete(oldestKey);
      }
    } else {
      const cached = this.textureCache.get(textureKey);
      this.textureCache.delete(textureKey);
      this.textureCache.set(textureKey, cached);
    }

    const [mesh, layers] = await Promise.all([
      this.loadMesh(),
      this.textureCache.get(textureKey),
    ]);

    return { template: validated, mesh, layers };
  }

  clear() {
    this.textureCache.clear();
    this.meshPromise = null;
  }
}
