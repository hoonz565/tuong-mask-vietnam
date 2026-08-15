# Try-On technical validation report

> Date: 2026-08-15  
> Scope: technical-pilot implementation on branch `try-on-mask`  
> Production approval: **not granted**; cultural, licensing, representative-human and device-matrix gates remain open.

## Automated checks

- Backend manifest validator: pass for 8 immutable technical-pilot templates, including file existence and SHA-256 equality.
- Frontend unit suite: pass for scheduling/backpressure, stale results, temporal hold/fade, pose matrix conversion, canonical mesh topology, mirroring/object-cover transforms, state transitions, manifest security and bounded worker cleanup.
- Deterministic template fixture matrix: pass for all 8 templates across neutral, blink, smile, jaw-open, brow-raise, yaw-left/right and pitch-up/down in mirrored and unmirrored modes (144 checks). It invokes the same mesh-frame function as the live renderer; minimum stable-triangle ratio was `0.982183`, no inverted triangle remained visible, and at most 14 unsafe triangles were culled in a fixture.
- ESLint: pass.
- Vite production build: pass with the Try-On feature in a lazy chunk.
- `npm audit`: 0 known vulnerabilities after compatible dependency updates.
- Combined Face Landmarker + parser artifact size: 17,247,297 bytes, below the 20 MB model-artifact target. This does not include the ONNX Runtime WASM runtime.

## Parser CPU smoke baseline

Command:

```powershell
python ml/try_on/scripts/benchmark_model.py frontend/public/models/try-on/face_parser.bisenet.resnet18.int8.128.222a5076.onnx --warmup 2 --iterations 20
```

Environment: Windows 11 build 26200, Intel64 Family 6 Model 170, 22 logical processors, native ONNX Runtime 1.22.1 CPU execution provider.

| Measurement | Result |
|---|---:|
| Session load | 97.42 ms |
| Median inference | 5.19 ms |
| p95 inference | 5.73 ms |
| Minimum / maximum | 3.99 / 5.81 ms |
| Output | 1×19×128×128 |

The shipped artifact has SHA-256 `222a507649df3b2f0edcda6b7d5da8616fd4ff40b2e4f47f334aa1ecac2192be`. Its synthetic FP32/INT8 argmax agreement is `0.917542` with mean absolute logit error `0.269675`. These are deterministic runtime/compatibility baselines, not browser-mobile or segmentation-quality launch results.

### Candidate and precision comparison

A second reproducible run compared the upstream BiSeNet ResNet-18 and ResNet-34 candidates in FP32 and static-QDQ INT8 form using the same deterministic input, native CPU provider, 2 warm-ups and 10 measured runs. FP32 and experimental ResNet-34 artifacts remained in ignored `.tmp` storage and are not shipped.

| Candidate | Precision | Bytes | Median | p95 | Synthetic argmax agreement vs own FP32 |
|---|---:|---:|---:|---:|---:|
| ResNet-18 | FP32 | 53,205,364 | 105.38 ms | 119.93 ms | reference |
| ResNet-18 | INT8 | 13,499,427 | 53.72 ms | 57.19 ms | 0.999786 |
| ResNet-34 | FP32 | 93,632,554 | 164.60 ms | 200.53 ms | reference |
| ResNet-34 | INT8 | 23,703,279 | 71.20 ms | 77.22 ms | 0.927563 |

ResNet-18 INT8 remains the technical-pilot choice: it is the only candidate under the 20 MB model-artifact target, is faster in this CPU baseline and preserves substantially stronger synthetic FP32/INT8 label agreement. These results do not establish real-image mIoU or production licensing.

The selected 512 QDQ graph was subsequently specialized to 256 and 128 spatial inputs. Native CPU median/p95 fell to `14.42/16.80 ms` at 256 and `5.19/5.73 ms` at 128. The 128 artifact was selected only after a production-browser benchmark; its lower semantic resolution explicitly increases the importance of the still-open boundary-F1 gate.

### Warp-method comparison

`ml/try_on/scripts/compare_warp_methods.py` applies the same deterministic pose + smile + brow + jaw deformation to the canonical MediaPipe topology and evaluates 898 triangle centroids at a 720p reference height. Dense piecewise-affine is the live renderer; TPS uses 64 spatially distributed controls and remains an offline-authoring candidate.

| Method | Median error | p95 error | Maximum |
|---|---:|---:|---:|
| Rigid similarity | 11.699 px | 23.679 px | 28.601 px |
| Dense piecewise-affine | 0.144 px | 0.576 px | 1.160 px |
| Offline TPS, 64 controls | 0.675 px | 2.513 px | 3.192 px |

This synthetic geometry fixture proves why rigid placement is inadequate and why dense piecewise-affine is the appropriate live path. It is not evidence for the real-participant fit gate.

## Production-browser regression

Chrome 151.0.7922.138 was run headlessly against the production Vite build with a deterministic prerecorded fake camera source and the local FastAPI template API.

- Manifest loaded 8 templates and both workers loaded their content-hashed local model assets.
- The session reached `live` with semantic parsing available.
- Bao Công rendered as a non-rigid face mesh with the black/white motifs visible; live eyes, teeth and mouth opening remained visible.
- The live production test switched through all 8 immutable template IDs, waited for each layered atlas to become the renderer's active template, and verified that every composited canvas frame changed before returning to Bao Công for capture.
- SVG atlases were rasterized at canonical 1024×1024 resolution before WebGL upload; no `texImage2D`/bad-image-data error remained.
- Capture transitioned `live -> capturing -> review`.
- Photobooth exposed square, portrait and photo-strip layouts; portrait selection exported `bao-cong-try-on.png` without download failure.
- `Shift+Tab` wrapped focus from the first to last dialog control, and closing restored focus to `Bắt đầu Try-On`.
- Closing during an intentionally delayed model load cancelled startup cleanly, detached the dialog and restored focus without an unhandled rejection.
- A 600-second warmed desktop session completed with no page exception or WebGL upload error. Twenty-one 30-second heap samples ranged from 15.5 MB to 58.7 MB and repeatedly fell after peaks rather than growing monotonically. State samples were `live` except for two recoverable `calibrating` samples caused by the prerecorded face fixture. This is a lifecycle/heap soak, not a physical-device thermal result.
- No unhandled page exception occurred. ONNX Runtime/TFLite emitted provider diagnostics only.

### Browser provider and cadence baseline

After five steady parser samples, the selected 128×128 QDQ graph and pre-resized face crop measured as follows. The end-to-end latency starts before crop creation and ends after the alpha mask returns to the main thread.

| Provider | Parser rate | End-to-end p95 | Warm-up | Median preprocess / inference / postprocess |
|---|---:|---:|---:|---:|
| WASM, 1 thread (default), observed runs | 8.34–9.09 Hz | 117.92–157.70 ms | 197.27–238.93 ms | 10.99–21.02 / 86.54–92.91 / 3.55–4.27 ms |
| WebGPU diagnostic override | 0.69 Hz | 1,834.81 ms | 3,866.37 ms | 19.17 / 1,568.56 / 4.99 ms |

WASM consistently passes the plan's ≥8 Hz parser cadence while the render loop remains about 100 fps under the headless virtual display. It does **not** reliably pass a <125 ms end-to-end parser p95: a later 20-sample run measured `157.70 ms`, mostly outside the worker's measured inference phases. WebGPU is not the default for this QDQ INT8 graph because measured behavior is materially worse. Two- and four-thread WASM session creation both timed out inside the already dedicated parser worker, so the pilot pins one thread pending a browser/runtime update and physical-device validation. None of these desktop figures is a phone FPS or motion-to-render launch claim.

## Gates still requiring people or external devices

- A cultural expert must approve every template, frame, character label and lore string.
- The research-only CelebAMask-HQ-derived parser weights require a production-compatible replacement or written license approval.
- A consented, person-disjoint 30–50 participant evaluation is required for mIoU, boundary F1, fit, jitter and group-wise fairness metrics.
- The named Android/iPhone/Safari device matrix, 4G cold-load test and 10-minute **physical-device thermal** run have not been executed; only the 10-minute desktop headless lifecycle/heap soak above is complete.
- Extreme pose, glasses, hands, hair occlusion and facial-hair limits need annotated human QA.

Until those gates close, `technical_pilot` must not be relabeled as an approved/public release channel.
