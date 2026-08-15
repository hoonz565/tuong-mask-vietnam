# Try-On data, code and artifact license matrix

| Item | Role | Terms known at pilot | Production decision |
|---|---|---|---|
| `@mediapipe/tasks-vision` 0.10.35 | Face landmark runtime | Apache-2.0 package | Pin version; verify downloaded task artifact before public release |
| MediaPipe canonical face model | UV/topology | MediaPipe repository Apache-2.0 | Allowed with attribution and notices |
| yakhyo/face-parsing code | Export/reference code | MIT | Code usable; does not override dataset/weight terms |
| Published BiSeNet weights | Pilot face parser | Trained on CelebAMask-HQ | R&D only; blocked from commercial/public release |
| CelebAMask-HQ | 19-class training dataset | Non-commercial research/education | Never treat as production-cleared data |
| LaPa | Alternative evaluation/training research | Non-commercial dataset terms | Research comparison only |
| BeautyREC / BeautyFace | Makeup transfer research | Non-commercial; contact authors for commercial use | Not a v1 runtime dependency |
| Eight Tuồng SVG atlases | Project technical templates | Project-authored pilot assets | Require copyright, attribution and cultural reviewer sign-off |
| User camera/captures | Ephemeral product input | User-controlled local data | No upload, analytics, persistence or secondary use |

The release owner must record reviewer, decision, date and evidence link for every row marked pending before changing `release_channel` from `technical_pilot`.
