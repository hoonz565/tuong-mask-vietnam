import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const defaultFixture = fileURLToPath(
  new URL('../../.tmp/try-on-e2e/fake-face-camera.y4m', import.meta.url),
);
const fixturePath = process.env.TRY_ON_FAKE_CAMERA_Y4M || defaultFixture;

async function routeTryOnApi(page) {
  await page.route('**/api/**', async (route) => {
    const requested = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:8001${requested.pathname}${requested.search}`,
    });
    await route.fulfill({ response });
  });
}

test.beforeEach(async ({ page }) => {
  test.skip(!existsSync(fixturePath), [
    'Missing fake-camera fixture.',
    'Build one outside Git with:',
    'python ml/try_on/scripts/build_fake_camera_fixture.py <consented-or-public-domain-image> .tmp/try-on-e2e/fake-face-camera.y4m --frames 300',
  ].join(' '));
  await routeTryOnApi(page);
});

test('live layered Try-On -> burst selection -> Photobooth download', async ({ page }, testInfo) => {
  const pageErrors = [];
  const webglErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (/texImage2D|bad image data/i.test(message.text())) webglErrors.push(message.text());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const launchButton = page.getByRole('button', { name: /Bắt đầu Try-On/i });
  await launchButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Cho phép camera và bắt đầu/i }).click();
  await expect(dialog).toHaveAttribute('data-state', 'live', { timeout: 90_000 });
  await expect(dialog).toHaveAttribute('data-parser-provider', /webgpu|wasm/);
  await expect(dialog.getByText(/Xử lý trên thiết bị/i)).toBeVisible();
  await expect.poll(
    async () => Number(await dialog.getAttribute('data-parser-samples')),
    { timeout: 45_000 },
  ).toBeGreaterThanOrEqual(20);
  const runtimeMetrics = {
    parserProvider: await dialog.getAttribute('data-parser-provider'),
    renderFps: Number(await dialog.getAttribute('data-render-fps')),
    parserHz: Number(await dialog.getAttribute('data-parser-hz')),
    parserP95Ms: Number(await dialog.getAttribute('data-parser-p95-ms')),
    parserWarmupMs: Number(await dialog.getAttribute('data-parser-warmup-ms')),
    parserPreprocessMs: Number(await dialog.getAttribute('data-parser-preprocess-ms')),
    parserInferenceMs: Number(await dialog.getAttribute('data-parser-inference-ms')),
    parserPostprocessMs: Number(await dialog.getAttribute('data-parser-postprocess-ms')),
  };
  expect(runtimeMetrics.renderFps).toBeGreaterThan(0);
  expect(runtimeMetrics.parserP95Ms).toBeGreaterThan(0);
  expect(runtimeMetrics.parserWarmupMs).toBeGreaterThan(0);
  await testInfo.attach('try-on-runtime-metrics.json', {
    body: JSON.stringify(runtimeMetrics, null, 2),
    contentType: 'application/json',
  });
  if (process.env.TRY_ON_REPORT_METRICS === 'true') {
    console.info(`[try-on-runtime-metrics] ${JSON.stringify(runtimeMetrics)}`);
  }

  const canvasDataLength = await dialog.getByRole('img', { name: /Hình camera với mặt nạ Tuồng/i }).evaluate(
    (canvas) => canvas.toDataURL('image/png').length,
  );
  expect(canvasDataLength).toBeGreaterThan(10_000);

  const templateMatrix = [
    ['Khổng Minh', 'khong_minh_v1'],
    ['Lý Phụng Đình — Xanh', 'ly_phung_dinh_blue_v1'],
    ['Quan Công', 'quan_cong_v1'],
    ['Tào Tháo', 'tao_thao_v1'],
    ['Trương Phi', 'truong_phi_v1'],
    ['Ác Ba', 'ac_ba_v1'],
    ['Đào Tam Xuân', 'dao_tam_xuan_v1'],
    ['Bao Công', 'bao_cong_v1'],
  ];
  let previousFrame = await dialog.getByRole('img', { name: /Hình camera với mặt nạ Tuồng/i })
    .evaluate((canvas) => canvas.toDataURL('image/png'));
  for (const [name, id] of templateMatrix) {
    await dialog.getByRole('button', { name: `Thử mặt nạ ${name}` }).click();
    await expect(dialog).toHaveAttribute('data-rendered-template-id', id);
    await expect.poll(
      () => dialog.getByRole('img', { name: /Hình camera với mặt nạ Tuồng/i })
        .evaluate((canvas) => canvas.toDataURL('image/png')),
    ).not.toBe(previousFrame);
    const nextFrame = await dialog.getByRole('img', { name: /Hình camera với mặt nạ Tuồng/i })
      .evaluate((canvas) => canvas.toDataURL('image/png'));
    previousFrame = nextFrame;
  }

  await dialog.getByRole('button', { name: /Chụp Photobooth/i }).click();
  await expect(dialog).toHaveAttribute('data-state', 'review', { timeout: 15_000 });
  await expect(dialog.getByRole('button', { name: /Chọn ảnh/ })).toHaveCount(3);
  await dialog.getByRole('button', { name: 'Chọn ảnh 3' }).click();
  await expect(dialog.getByRole('button', { name: 'Chọn ảnh 3' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('radio', { name: /Photo strip/i }).click();

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: /Tải PNG/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('bao-cong-try-on.png');
  expect(await download.failure()).toBeNull();

  await dialog.getByRole('button', { name: /Đóng Photobooth/i }).click();
  await expect(dialog).toHaveCount(0);
  await expect(launchButton).toBeFocused();
  expect(pageErrors).toEqual([]);
  expect(webglErrors).toEqual([]);
});

test('closing during delayed model initialization cancels cleanly', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  let markModelRequestStarted;
  let releaseModelRequest;
  const modelRequestStarted = new Promise((resolve) => { markModelRequestStarted = resolve; });
  const modelRequestRelease = new Promise((resolve) => { releaseModelRequest = resolve; });
  const modelRoutePattern = '**/models/try-on/face_landmarker*.task';
  await page.route(modelRoutePattern, async (route) => {
    markModelRequestStarted();
    await modelRequestRelease;
    await route.continue().catch(() => {});
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const launchButton = page.getByRole('button', { name: /Bắt đầu Try-On/i });
  await launchButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Cho phép camera và bắt đầu/i }).click();
  await modelRequestStarted;
  await dialog.getByRole('button', { name: /Đóng Try-On/i }).click();
  await expect(dialog).toHaveCount(0);
  await expect(launchButton).toBeFocused();
  releaseModelRequest();
  await page.unrouteAll({ behavior: 'wait' });
  expect(pageErrors).toEqual([]);
});

test('opt-in long-session camera/model/GPU soak', async ({ page }, testInfo) => {
  test.skip(
    process.env.TRY_ON_LONG_SESSION !== 'true',
    'Set TRY_ON_LONG_SESSION=true to run the physical-device soak.',
  );
  const durationMs = Number(process.env.TRY_ON_LONG_SESSION_MS || 600_000);
  test.setTimeout(durationMs + 120_000);
  const pageErrors = [];
  const heapSamples = [];
  const stateSamples = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Bắt đầu Try-On/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Cho phép camera và bắt đầu/i }).click();
  await expect(dialog).toHaveAttribute('data-state', 'live', { timeout: 90_000 });

  const startedAt = Date.now();
  await expect.poll(async () => {
    heapSamples.push(await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null));
    stateSamples.push(await dialog.getAttribute('data-state'));
    return Date.now() - startedAt >= durationMs;
  }, {
    timeout: durationMs + 60_000,
    intervals: [30_000],
  }).toBe(true);

  await testInfo.attach('try-on-soak-metrics.json', {
    body: JSON.stringify({ durationMs, heapSamples, stateSamples, pageErrors }, null, 2),
    contentType: 'application/json',
  });
  if (process.env.TRY_ON_REPORT_METRICS === 'true') {
    console.info(`[try-on-soak-metrics] ${JSON.stringify({ durationMs, heapSamples, stateSamples, pageErrors })}`);
  }
  expect(pageErrors).toEqual([]);
  expect(stateSamples).not.toContain('error');
  expect(stateSamples).not.toContain('unsupported');
  await dialog.getByRole('button', { name: /Đóng Try-On/i }).click();
  await expect(dialog).toHaveCount(0);
});
