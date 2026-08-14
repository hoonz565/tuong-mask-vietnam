import { describe, expect, it } from 'vitest';
import { validateTryOnTemplate } from './tryOnService';

const validTemplate = {
  id: 'technical_fixture_v1',
  mask_id: 'technical_fixture',
  name: 'Technical fixture',
  version: 1,
  release_channel: 'technical_pilot',
  topology_version: 'mediapipe_face_468_v1',
  atlas_url: '/try-on/templates/technical_fixture/v1/atlas.svg',
  asset_sha256: 'a'.repeat(64),
  thumbnail_url: '/static/images/fixture.png',
  layers: [{ id: 'base' }],
  pose_limits: { yaw: 35, pitch: 25 },
  cultural_review: { status: 'pending_expert_review' },
  license: { asset_owner: 'project' },
};

describe('validateTryOnTemplate', () => {
  it('accepts a complete same-origin immutable template record', () => {
    expect(validateTryOnTemplate(validTemplate)).toBe(validTemplate);
  });

  it('rejects an invalid asset digest', () => {
    expect(() => validateTryOnTemplate({ ...validTemplate, asset_sha256: 'not-a-digest' }))
      .toThrow('asset_sha256');
  });

  it('rejects a texture outside the Try-On asset namespace', () => {
    expect(() => validateTryOnTemplate({ ...validTemplate, atlas_url: 'https://example.com/atlas.svg' }))
      .toThrow('same-origin');
  });
});
