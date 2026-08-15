# Try-On template authoring and review

## Authoring contract

Each template lives at an immutable versioned path and binds to the MediaPipe canonical 468-point topology. The atlas must be transparent outside painted regions and must not include baked-in eyeballs, irises, teeth or mouth cavity. Required manifest fields include linked `mask_id`, version, atlas SHA-256, semantic layers, pose limits, release channel, license and cultural review state.

The canonical SVG atlas must expose three top-level semantic groups: `layer-base`, `layer-eyes` and `layer-mouth`. The runtime rasterizes each group independently at 1024×1024 and uploads one WebGL texture per group. Their manifest bindings are `base`, `eye_motifs` and `mouth`; adding a new layer ID requires an explicit `svg_group` field. Keep shared masks and reusable definitions inside `<defs>`, outside the layer groups.

Review the neutral, blink, brow raise, smile, jaw-open, yaw ±35° and pitch ±25° fixtures. Reject the asset for inverted triangles, torn strokes, occluded eyes/teeth, character motif mixing, unintended skin-tone changes or attribution mismatch.

Run `npm run test:fixtures` from `frontend/` before submitting an asset for review. The validator executes the production mesh-buffer algorithm in mirrored and unmirrored modes over neutral, blink, smile, jaw-open, brow-raise, yaw-left/right and pitch-up/down for every manifest template, rejects visible inversions or excessive stretch, and confirms conservative far-side fading. This technical check does not replace the cultural review below.

## Cultural approval checklist

- Character name, type, colours, motifs and lore match approved source material.
- No motif has been invented, moved between characters or recoloured without reviewer approval.
- Copyright/source, author, attribution text and allowed product use are recorded.
- The reviewer sees the template on multiple face shapes and all supported pose/expression fixtures.
- Reviewer name, decision date, version and evidence are retained outside the public manifest.
- Only an approved immutable version may expose a public `TRY THIS MASK` action.

The eight repository atlases are explicitly `technical_pilot` and `pending_expert_review`; they are implementation fixtures, not cultural approval claims.
