import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const defaultFixture = fileURLToPath(
  new URL('../../.tmp/try-on-e2e/fake-face-camera.y4m', import.meta.url),
);
const fixturePath = process.env.TRY_ON_FAKE_CAMERA_Y4M || defaultFixture;

test('executes the explicit WebGPU parser diagnostic path', async ({ page }) => {
  test.skip(!existsSync(fixturePath), 'Missing external fake-camera fixture.');
  await page.route('**/api/**', async (route) => {
    const requested = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:8001${requested.pathname}${requested.search}`,
    });
    await route.fulfill({ response });
  });

  await page.goto('/?tryOnParser=webgpu', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Bắt đầu Try-On/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Cho phép camera và bắt đầu/i }).click();
  await expect(dialog).toHaveAttribute('data-state', 'live', { timeout: 90_000 });
  await expect(dialog).toHaveAttribute('data-parser-provider', 'webgpu');
  await expect.poll(
    async () => Number(await dialog.getAttribute('data-parser-samples')),
    { timeout: 30_000 },
  ).toBeGreaterThanOrEqual(5);

  if (process.env.TRY_ON_REPORT_METRICS === 'true') {
    const metrics = {
      parserProvider: await dialog.getAttribute('data-parser-provider'),
      renderFps: Number(await dialog.getAttribute('data-render-fps')),
      parserHz: Number(await dialog.getAttribute('data-parser-hz')),
      parserP95Ms: Number(await dialog.getAttribute('data-parser-p95-ms')),
      parserWarmupMs: Number(await dialog.getAttribute('data-parser-warmup-ms')),
      parserPreprocessMs: Number(await dialog.getAttribute('data-parser-preprocess-ms')),
      parserInferenceMs: Number(await dialog.getAttribute('data-parser-inference-ms')),
      parserPostprocessMs: Number(await dialog.getAttribute('data-parser-postprocess-ms')),
    };
    console.info(`[try-on-runtime-metrics] ${JSON.stringify(metrics)}`);
  }
  await dialog.getByRole('button', { name: /Đóng Try-On/i }).click();
  await expect(dialog).toHaveCount(0);
});
