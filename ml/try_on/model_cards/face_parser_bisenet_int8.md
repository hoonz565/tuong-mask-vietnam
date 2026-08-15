# Face parser BiSeNet ResNet-18 INT8 — technical model card

Status: R&D technical pilot only. This artifact is blocked from commercial/public production until dataset and weight licensing is cleared.

## Intended use

The browser worker uses the model only to clip a geometry-driven Tuồng overlay around the face, eyes, brows, nose, lips, mouth and hair. It is not used for identity recognition, demographic inference, authentication or medical use. Pixels, logits, masks and landmarks remain in browser memory and are not uploaded.

## Artifact and preprocessing

- Runtime: ONNX Runtime Web 1.27.0. The measured default is single-threaded WASM; WebGPU is retained as an explicit diagnostic override because this QDQ graph is much slower there.
- Input: RGB 128×128, float32 NCHW, `/255`, ImageNet mean `[0.485, 0.456, 0.406]`, standard deviation `[0.229, 0.224, 0.225]`.
- Output: `[1, 19, 128, 128]` logits; label order follows CelebAMask-HQ.
- Runtime INT8 SHA-256: `222a507649df3b2f0edcda6b7d5da8616fd4ff40b2e4f47f334aa1ecac2192be`.
- Runtime size: 13,488,701 bytes. Face parser plus Face Landmarker totals 17,247,297 bytes, below the 20 MB model-artifact target. The ONNX Runtime WASM binary is not included in that total.
- Source ResNet-18 FP32 SHA-256: `0d9bd318e46987c3bdbface9e2c0f461cae1c6ac6ea6d43bbe541a91727e33f` (not committed or shipped).
- Specialized 128×128 FP32 SHA-256: `5f41578fdb05cda489ecfa0bf8d4b247c9b5e6f18ef9a1c17dfc37496242fa77` (not committed or shipped).
- Quantization and fixed-resolution specialization are reproducible through `quantize_model.py` and `specialize_model_resolution.py` in the adjacent scripts directory.

## Technical validation completed

- ONNX checker and CPU execution smoke tests passed; the shipped artifact returned `[1, 19, 128, 128]`.
- On deterministic synthetic input, specialized FP32/INT8 pixel argmax agreement was `0.917542`; mean absolute logit error was `0.269675`. This is a compatibility signal, not real-image accuracy.
- Native CPU baseline (`onnxruntime 1.22.1`, Windows 11, 22 logical processors, 2 warm-ups + 20 measured runs): median `5.19 ms`, p95 `5.73 ms`, range `3.99–5.81 ms`; session load `97.42 ms`.
- Production-build Chrome 151 fake-camera runs, default single-threaded WASM: parser `8.34–9.09 Hz`, end-to-end p95 `117.92–157.70 ms`, warm-up `197.27–238.93 ms`; median preprocess/inference/postprocess ranges `10.99–21.02/86.54–92.91/3.55–4.27 ms`; render loop about `100 fps` in the headless harness. Cadence passes, but latency does not reliably meet a <125 ms technical threshold.
- The same 128 graph on the explicit WebGPU diagnostic path measured `0.69 Hz`, p95 `1,834.81 ms`, and median inference `1,568.56 ms`. Evidence therefore overrides the initial provider-order hypothesis for this artifact.
- A four-way 512×512 candidate/precision study still selected ResNet-18 INT8 over ResNet-34; see the technical validation report for hashes and results.

## Data and licensing

The upstream repository code is MIT, but its published weights were trained on CelebAMask-HQ, whose stated use is non-commercial research/education. Quantization and resolution specialization do not remove that dependency. Public or commercial deployment is prohibited by project policy until written approval or a compatibly licensed replacement exists.

## Known limitations and release gates

- The 128×128 runtime choice trades semantic boundary detail for browser cadence. It cannot pass release without the consented key-region mIoU and boundary-F1 evaluation.
- Glasses, hands, facial hair, hair occlusion, extreme pose and non-photographic inputs can fail.
- The current calibration and camera media are deterministic technical fixtures, not a representative evaluation set.
- Required before production: consented person-disjoint evaluation, key-region mIoU ≥0.85, boundary F1 ≥0.80, group-wise reporting, physical browser/device benchmark, visual regression and signed license review.
