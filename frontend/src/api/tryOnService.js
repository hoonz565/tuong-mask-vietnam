import request from './client';

const REQUIRED_TEMPLATE_FIELDS = [
  'id',
  'mask_id',
  'name',
  'version',
  'release_channel',
  'topology_version',
  'texture_source',
  'thumbnail_url',
  'layers',
  'pose_limits',
  'cultural_review',
  'license',
];

export function validateTryOnTemplate(template) {
  if (!template || typeof template !== 'object') {
    throw new TypeError('Try-On template must be an object.');
  }

  const missingFields = REQUIRED_TEMPLATE_FIELDS.filter((field) => !(field in template));
  if (missingFields.length > 0) {
    throw new Error(`Invalid Try-On template ${template.id || '<unknown>'}: missing ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(template.layers) || template.layers.length === 0) {
    throw new Error(`Invalid Try-On template ${template.id}: at least one layer is required.`);
  }

  if (!template.thumbnail_url.startsWith('/')) {
    throw new Error(`Invalid Try-On template ${template.id}: thumbnail must be a same-origin asset.`);
  }

  if (template.texture_source === 'layered_svg') {
    if (!template.atlas_url?.startsWith('/try-on/templates/')) {
      throw new Error(`Invalid Try-On template ${template.id}: atlas must be a same-origin Try-On asset.`);
    }
    if (!/^[0-9a-f]{64}$/.test(template.asset_sha256)) {
      throw new Error(`Invalid Try-On template ${template.id}: asset_sha256 must be a lowercase SHA-256 digest.`);
    }
  } else if (template.texture_source === 'gallery_image') {
    if (!/^\/static\/images\/[A-Za-z0-9._-]+$/.test(template.source_image_url || '')) {
      throw new Error(`Invalid Try-On template ${template.id}: source image must be a same-origin gallery asset.`);
    }
  } else {
    throw new Error(`Invalid Try-On template ${template.id}: unsupported texture source ${template.texture_source}.`);
  }

  if (template.topology_version !== 'mediapipe_face_468_v1') {
    throw new Error(`Invalid Try-On template ${template.id}: unsupported topology ${template.topology_version}.`);
  }

  if (!Number.isFinite(template.pose_limits?.yaw) || !Number.isFinite(template.pose_limits?.pitch)) {
    throw new Error(`Invalid Try-On template ${template.id}: numeric pose limits are required.`);
  }

  return template;
}

export async function getTryOnTemplates({ releaseChannel } = {}) {
  const templates = await request('/try-on/templates');
  if (!Array.isArray(templates)) {
    throw new Error('Try-On templates response must be an array.');
  }

  const validated = templates.map(validateTryOnTemplate);
  const ids = new Set(validated.map((template) => template.id));
  if (ids.size !== validated.length) {
    throw new Error('Try-On templates response contains duplicate ids.');
  }

  return releaseChannel
    ? validated.filter((template) => template.release_channel === releaseChannel)
    : validated;
}

export async function getTryOnTemplate(templateId) {
  const template = await request(`/try-on/templates/${encodeURIComponent(templateId)}`);
  return validateTryOnTemplate(template);
}

export async function sha256Text(source) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is required to verify Try-On assets.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function loadTryOnTextAsset(path, expectedSha256) {
  if (!path.startsWith('/try-on/')) {
    throw new Error(`Blocked non Try-On asset path: ${path}`);
  }

  const response = await fetch(path, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Unable to load Try-On asset ${path}: ${response.status}`);
  }
  const source = await response.text();
  if (expectedSha256) {
    const actualSha256 = await sha256Text(source);
    if (actualSha256 !== expectedSha256) {
      throw new Error(`Try-On asset integrity check failed: ${path}`);
    }
  }
  return source;
}
