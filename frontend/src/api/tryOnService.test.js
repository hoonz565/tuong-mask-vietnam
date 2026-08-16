import { describe, expect, it } from 'vitest';
import { sha256Text, validateTryOnTemplate } from './tryOnService';

const validTemplate = {
  id: 'technical_fixture_v1',
  mask_id: 'technical_fixture',
  name: 'Technical fixture',
  version: 1,
  release_channel: 'technical_pilot',
  topology_version: 'mediapipe_face_468_v1',
  texture_source: 'layered_svg',
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

  it('accepts a same-origin gallery image template', () => {
    const galleryTemplate = {
      ...validTemplate,
      texture_source: 'gallery_image',
      source_image_url: '/static/images/18.png',
    };
    delete galleryTemplate.atlas_url;
    delete galleryTemplate.asset_sha256;
    expect(validateTryOnTemplate(galleryTemplate)).toBe(galleryTemplate);
  });

  it('rejects an external gallery image', () => {
    expect(() => validateTryOnTemplate({
      ...validTemplate,
      texture_source: 'gallery_image',
      source_image_url: 'https://example.com/18.png',
    })).toThrow('same-origin gallery asset');
  });
});

describe('Try-On asset integrity', () => {
  it('computes the standard SHA-256 digest for fetched text assets', async () => {
    await expect(sha256Text('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
