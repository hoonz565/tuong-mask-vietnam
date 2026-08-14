import * as ort from 'onnxruntime-web/webgpu';

const MODEL_PATH = '/models/try-on/face_parser.bisenet.resnet18.int8.28935b49.onnx';
const INPUT_SIZE = 512;
const OUTPUT_SIZE = 256;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const ALLOWED_LABELS = new Set([1, 2, 3, 10, 12, 13]);

let session;
let executionProvider = 'wasm';
let canvas;
let context;

ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.logLevel = 'error';

function ensureCanvas() {
  if (!canvas) {
    canvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
    context = canvas.getContext('2d', { willReadFrequently: true });
  }
}

async function createSession() {
  const providers = globalThis.navigator?.gpu ? ['webgpu', 'wasm'] : ['wasm'];
  try {
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
    });
    executionProvider = providers[0];
  } catch (error) {
    if (providers.length === 1) throw error;
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    executionProvider = 'wasm';
  }
}

function preprocess(bitmap) {
  ensureCanvas();
  context.clearRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  context.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const { data } = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const plane = INPUT_SIZE * INPUT_SIZE;
  const input = new Float32Array(plane * 3);

  for (let pixel = 0; pixel < plane; pixel += 1) {
    const rgba = pixel * 4;
    input[pixel] = (data[rgba] / 255 - MEAN[0]) / STD[0];
    input[plane + pixel] = (data[rgba + 1] / 255 - MEAN[1]) / STD[1];
    input[plane * 2 + pixel] = (data[rgba + 2] / 255 - MEAN[2]) / STD[2];
  }

  return new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

function createAlphaMask(output) {
  const [batch, classes, height, width] = output.dims;
  if (batch !== 1 || classes < 14) {
    throw new Error(`Unexpected parser output: ${output.dims.join('x')}`);
  }

  const alpha = new Uint8Array(OUTPUT_SIZE * OUTPUT_SIZE);
  const stride = height * width;
  for (let y = 0; y < OUTPUT_SIZE; y += 1) {
    const sy = Math.min(height - 1, Math.floor((y / OUTPUT_SIZE) * height));
    for (let x = 0; x < OUTPUT_SIZE; x += 1) {
      const sx = Math.min(width - 1, Math.floor((x / OUTPUT_SIZE) * width));
      const offset = sy * width + sx;
      let bestLabel = 0;
      let bestScore = -Infinity;
      for (let label = 0; label < classes; label += 1) {
        const score = output.data[label * stride + offset];
        if (score > bestScore) {
          bestScore = score;
          bestLabel = label;
        }
      }
      alpha[y * OUTPUT_SIZE + x] = ALLOWED_LABELS.has(bestLabel) ? 255 : 0;
    }
  }

  // A compact 3x3 box feather removes isolated one-pixel edges without blurring artwork.
  const feathered = new Uint8Array(alpha.length);
  for (let y = 0; y < OUTPUT_SIZE; y += 1) {
    for (let x = 0; x < OUTPUT_SIZE; x += 1) {
      let sum = 0;
      let count = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const px = x + ox;
          const py = y + oy;
          if (px >= 0 && px < OUTPUT_SIZE && py >= 0 && py < OUTPUT_SIZE) {
            sum += alpha[py * OUTPUT_SIZE + px];
            count += 1;
          }
        }
      }
      feathered[y * OUTPUT_SIZE + x] = Math.round(sum / count);
    }
  }
  return feathered;
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      await createSession();
      self.postMessage({ type: 'ready', executionProvider });
    } catch (error) {
      self.postMessage({ type: 'error', stage: 'init', message: error.message });
    }
    return;
  }

  if (data.type === 'process') {
    const { bitmap, timestamp, roi } = data;
    try {
      if (!session) throw new Error('Face parser is not initialized.');
      const input = preprocess(bitmap);
      const inputName = session.inputNames[0];
      const results = await session.run({ [inputName]: input });
      const output = results[session.outputNames[0]];
      const alpha = createAlphaMask(output);
      self.postMessage({
        type: 'result',
        timestamp,
        roi,
        width: OUTPUT_SIZE,
        height: OUTPUT_SIZE,
        alpha,
      }, [alpha.buffer]);
    } catch (error) {
      self.postMessage({ type: 'error', stage: 'process', timestamp, message: error.message });
    } finally {
      bitmap?.close();
    }
    return;
  }

  if (data.type === 'dispose') {
    await session?.release();
    session = undefined;
    self.postMessage({ type: 'disposed' });
    self.close();
  }
};
