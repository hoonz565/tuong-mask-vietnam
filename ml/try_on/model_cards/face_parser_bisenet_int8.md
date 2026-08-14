# Face parser BiSeNet ResNet-18 INT8 — technical model card

Status: R&D technical pilot only. This artifact is blocked from commercial/public production until dataset and weight licensing is cleared.

## Intended use

The browser worker uses the model only to clip a geometry-driven Tuồng overlay around face, eyes, brows, nose, lips, mouth and hair. It is not used for identity recognition, demographic inference, authentication or medical use. Pixels, logits, masks and landmarks remain in browser memory and are not uploaded.

## Artifact and preprocessing

- Runtime: ONNX Runtime Web 1.27.0, provider preference `webgpu -> wasm`.
- Input: RGB 512×512, float32 NCHW, `/255`, ImageNet mean `[0.485, 0.456, 0.406]`, standard deviation `[0.229, 0.224, 0.225]`.
- Output: `[1, 19, 512, 512]` logits; label order follows CelebAMask-HQ.
- Runtime INT8 SHA-256: `28935b494a29a8fa4722ccda0ad785d7e742d96d38e04199b744609333eed38a`.
- Runtime size: 13,499,427 bytes. Face parser plus Face Landmarker totals 17,258,023 bytes, below the 20 MB model-artifact target.
- Source FP32 SHA-256: `0d9bd318e46987c3bdbface9e2c0f461cae1c6ac6ea6d43bbe541a91727e33f` (not committed or shipped).
- Quantization command is reproducible through `ml/try_on/scripts/quantize_model.py`.

## Technical validation completed

- ONNX checker passed before and after QDQ quantization.
- CPU execution smoke test returned `[1, 19, 512, 512]`.
- On deterministic synthetic input, FP32/INT8 pixel argmax agreement was `0.9997864`; mean absolute logit error was `0.0620526`.
- Native CPU smoke benchmark (`onnxruntime 1.22.1`, Windows 11, 22 logical processors, 2 warm-ups + 10 measured runs): median `48.56 ms`, p95 `54.11 ms`, range `41.05–54.37 ms`; session load `99.68 ms`. Run with `ml/try_on/scripts/benchmark_model.py`.
- These are compatibility checks, not claims of real-world segmentation quality.

## Data and licensing

The upstream repository code is MIT, but its published weights were trained on CelebAMask-HQ, whose stated use is non-commercial research/education. Quantization does not remove that dependency. Public or commercial deployment is prohibited by project policy until written approval or a compatibly licensed replacement exists.

## Known limitations and release gates

- Glasses, hands, facial hair, hair occlusion, extreme pose and non-photographic inputs can fail.
- The current calibration images are deterministic technical fixtures, not a representative evaluation set.
- Required before production: consented person-disjoint evaluation, key-region mIoU ≥0.85, boundary F1 ≥0.80, group-wise reporting, browser/device benchmark, visual regression and signed license review.
