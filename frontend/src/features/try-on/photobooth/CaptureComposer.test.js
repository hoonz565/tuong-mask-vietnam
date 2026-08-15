import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeCapture } from './CaptureComposer';

describe('composeCapture', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses all three burst frames in the photo-strip layout and releases bitmaps', async () => {
    const bitmaps = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      width: 640,
      height: 480,
      close: vi.fn(),
    }));
    const drawImage = vi.fn();
    const context = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage,
      fillText: vi.fn(),
    };
    const output = new Blob(['photobooth'], { type: 'image/png' });
    const canvas = {
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback) => callback(output)),
      width: 0,
      height: 0,
    };
    let nextBitmap = 0;
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmaps[nextBitmap++]));
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });

    const result = await composeCapture([new Blob(), new Blob(), new Blob()], 'strip', { name: 'Fixture' });

    expect(result).toBe(output);
    expect(drawImage).toHaveBeenCalledTimes(3);
    expect(drawImage.mock.calls.map(([bitmap]) => bitmap.id)).toEqual([0, 1, 2]);
    bitmaps.forEach((bitmap) => expect(bitmap.close).toHaveBeenCalledOnce());
  });
});
