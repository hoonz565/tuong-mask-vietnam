import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_ROOT = '/models/try-on/mediapipe-wasm';
const MODEL_PATH = '/models/try-on/face_landmarker.float16.v1.64184e22.task';

let landmarker;
let delegate = 'CPU';

async function createLandmarker(preferredDelegate = 'GPU') {
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
  const create = (nextDelegate) => FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_PATH,
      delegate: nextDelegate,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: 0.55,
    minFacePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });

  try {
    landmarker = await create(preferredDelegate);
    delegate = preferredDelegate;
  } catch (error) {
    if (preferredDelegate === 'CPU') throw error;
    landmarker = await create('CPU');
    delegate = 'CPU';
  }
}

function serializeCategories(categories = []) {
  return categories.map(({ categoryName, score }) => ({ categoryName, score }));
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      await createLandmarker(data.preferredDelegate || 'GPU');
      self.postMessage({ type: 'ready', delegate });
    } catch (error) {
      self.postMessage({ type: 'error', stage: 'init', message: error.message });
    }
    return;
  }

  if (data.type === 'process') {
    const { bitmap, timestamp } = data;
    try {
      if (!landmarker) throw new Error('Face Landmarker is not initialized.');
      const result = landmarker.detectForVideo(bitmap, timestamp);
      const landmarks = result.faceLandmarks?.[0]?.map(({ x, y, z, visibility }) => ({
        x, y, z, visibility: visibility ?? 1,
      })) || [];
      const blendshapes = serializeCategories(result.faceBlendshapes?.[0]?.categories);
      const matrix = result.facialTransformationMatrixes?.[0]?.data
        ? Array.from(result.facialTransformationMatrixes[0].data)
        : null;

      self.postMessage({
        type: 'result',
        timestamp,
        landmarks,
        blendshapes,
        matrix,
      });
    } catch (error) {
      self.postMessage({ type: 'error', stage: 'process', timestamp, message: error.message });
    } finally {
      bitmap?.close();
    }
    return;
  }

  if (data.type === 'dispose') {
    landmarker?.close();
    landmarker = undefined;
    self.postMessage({ type: 'disposed' });
    self.close();
  }
};
