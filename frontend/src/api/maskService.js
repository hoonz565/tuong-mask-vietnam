// api/maskService.js — All mask-related API calls
// Components import from here; never call fetch() directly in UI code.

import request, { API_BASE } from './client';

/**
 * Augments a mask object: resolves relative image_url to an absolute URL
 * and injects a fallback description when the DB field is empty.
 */
function augmentMask(mask) {
  return {
    ...mask,
    image_url:
      mask.image_url && !mask.image_url.startsWith('http')
        ? `${API_BASE}${mask.image_url}`
        : mask.image_url,
    description:
      mask.description ||
      `A legendary artifact from the Tuong heritage. Classified under ${
        mask.category || 'Unknown'
      }, this mask carries the spirit of ancient performances. Its origins date back centuries, symbolizing distinct virtues on the stage.`,
  };
}

/** GET /api/masks — Returns the full mask collection. */
export async function getAllMasks() {
  const data = await request('/masks');
  return data.map(augmentMask);
}

/** GET /api/masks/:id — Returns a single mask by ID. */
export async function getMaskById(id) {
  const data = await request(`/masks/${id}`);
  return augmentMask(data);
}

/**
 * POST /api/masks/match — Euclidean-distance personality matcher.
 * @param {{ strength: number, intellect: number, spirit: number, ferocity: number }} stats
 * @returns {Promise<object>} The best-matching mask (already augmented).
 */
export async function matchMask(stats) {
  const data = await request('/masks/match', {
    method: 'POST',
    body: JSON.stringify(stats),
  });
  return augmentMask(data);
}
