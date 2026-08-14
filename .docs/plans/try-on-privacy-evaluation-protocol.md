# Try-On privacy and evaluation protocol

Camera frames, crops, landmarks, parsing masks and captures remain in volatile browser memory. The app has no camera upload endpoint. Closing Try-On stops every track, terminates both workers, disposes model/GPU resources and clears references. Capture creates a local Blob only; sharing happens only after an explicit user action.

Before collecting an evaluation set, obtain explicit written consent covering purpose, access, retention, deletion and no secondary use. Assign random subject IDs; store consent separately; do not collect identity labels or infer demographics. Split validation by participant, not frame. Keep raw participant media outside Git in access-controlled storage.

Report alignment, parsing and session success by lighting, skin-tone range, glasses, facial hair and face-shape group. The production gates are the metrics in `ai-virtual-try-on-plan.md`; synthetic fixtures and gallery artwork cannot satisfy fairness or human visual-quality gates.
