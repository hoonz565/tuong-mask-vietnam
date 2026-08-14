# Try-On technical validation report

> Date: 2026-08-15  
> Scope: technical-pilot implementation on branch `try-on-mask`  
> Production approval: **not granted**; cultural, licensing, representative-human and device-matrix gates remain open.

## Automated checks

- Backend manifest validator: pass for 8 immutable technical-pilot templates, including file existence and SHA-256 equality.
- Frontend unit suite: pass for scheduling/backpressure, stale results, temporal hold/fade, pose matrix conversion, canonical mesh topology, mirroring/object-cover transforms, state transitions, manifest security and bounded worker cleanup.
- ESLint: pass.
- Vite production build: pass with the Try-On feature in a lazy chunk.
- `npm audit`: 0 known vulnerabilities after compatible dependency updates.
- Combined Face Landmarker + parser artifact size: 17,258,023 bytes, below the 20 MB model-artifact target. This does not include the ONNX Runtime WASM runtime.

## Parser CPU smoke baseline

Command:

```powershell
python ml/try_on/scripts/benchmark_model.py frontend/public/models/try-on/face_parser.bisenet.resnet18.int8.28935b49.onnx --warmup 2 --iterations 10
```

Environment: Windows 11 build 26200, Intel64 Family 6 Model 170, 22 logical processors, native ONNX Runtime 1.22.1 CPU execution provider.

| Measurement | Result |
|---|---:|
| Session load | 99.68 ms |
| Median inference | 48.56 ms |
| p95 inference | 54.11 ms |
| Minimum / maximum | 41.05 / 54.37 ms |
| Output | 1×19×512×512 |

This is a deterministic runtime smoke baseline, not a browser/mobile or segmentation-quality launch result.

## Production-browser regression

Chrome 151.0.7922.138 was run headlessly against the production Vite build with a deterministic prerecorded fake camera source and the local FastAPI template API.

- Manifest loaded 8 templates and both workers loaded their content-hashed local model assets.
- The session reached `live` with semantic parsing available.
- Bao Công rendered as a non-rigid face mesh with the black/white motifs visible; live eyes, teeth and mouth opening remained visible.
- SVG atlases were rasterized at canonical 1024×1024 resolution before WebGL upload; no `texImage2D`/bad-image-data error remained.
- Capture transitioned `live -> capturing -> review`.
- Photobooth exposed square, portrait and photo-strip layouts; portrait selection exported `bao-cong-try-on.png` without download failure.
- `Shift+Tab` wrapped focus from the first to last dialog control, and closing restored focus to `Bắt đầu Try-On`.
- Closing during an intentionally delayed model load cancelled startup cleanly, detached the dialog and restored focus without an unhandled rejection.
- A 60-second warmed session remained `live` with no page exception or WebGL upload error. The observed JS heap dropped from 40.3 MB to 20.5 MB in the second 30-second window, so this smoke run showed no monotonic heap growth; it does not replace the required 10-minute physical-device thermal/memory test.
- No unhandled page exception occurred. ONNX Runtime/TFLite emitted provider diagnostics only.

## Gates still requiring people or external devices

- A cultural expert must approve every template, frame, character label and lore string.
- The research-only CelebAMask-HQ-derived parser weights require a production-compatible replacement or written license approval.
- A consented, person-disjoint 30–50 participant evaluation is required for mIoU, boundary F1, fit, jitter and group-wise fairness metrics.
- The named Android/iPhone/Safari device matrix, 4G cold-load test and 10-minute thermal/memory run have not been executed.
- Extreme pose, glasses, hands, hair occlusion and facial-hair limits need annotated human QA.

Until those gates close, `technical_pilot` must not be relabeled as an approved/public release channel.
