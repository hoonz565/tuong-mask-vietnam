import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const defaultFakeCamera = fileURLToPath(
  new URL('../.tmp/try-on-e2e/fake-face-camera.y4m', import.meta.url),
);
const fakeCamera = process.env.TRY_ON_FAKE_CAMERA_Y4M || defaultFakeCamera;
const cameraLaunchArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-video-capture=${fakeCamera}`,
  '--autoplay-policy=no-user-gesture-required',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: 'chrome',
    headless: true,
    permissions: ['camera'],
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: cameraLaunchArgs,
    },
  },
  webServer: [
    {
      command: 'python -m uvicorn main:app --host 127.0.0.1 --port 8001',
      cwd: '../backend',
      url: 'http://127.0.0.1:8001/api/try-on/templates',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
