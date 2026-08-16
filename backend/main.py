from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
import sqlite3
import math
import os
import json

app = FastAPI(title="Vietnamese Tuong Mask API")

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), 'masks.db')
TRY_ON_MANIFEST_PATH = os.path.join(os.path.dirname(__file__), 'try_on_templates.json')
TRY_ON_METRICS_ENABLED = os.getenv("TRY_ON_METRICS_ENABLED", "false").lower() == "true"
_mask_cache = None
_mask_cache_mtime_ns = None
_try_on_cache = None
_try_on_cache_mtime_ns = None

# Ensure static/images directory exists
# os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'images'), exist_ok=True)
# app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), 'static')), name="static")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_mask(row: sqlite3.Row) -> dict:
    """Convert a DB row to the standard mask object shape."""
    d = dict(row)
    d["stats"] = {
        "strength": d.pop("strength", 50),
        "intellect": d.pop("intellect", 50),
        "spirit": d.pop("spirit", 50),
        "ferocity": d.pop("ferocity", 50),
    }
    return d


def get_cached_masks():
    """Load masks once and refresh the cache when the SQLite file changes."""
    global _mask_cache, _mask_cache_mtime_ns

    current_mtime_ns = os.stat(DB_PATH).st_mtime_ns
    if _mask_cache is None or _mask_cache_mtime_ns != current_mtime_ns:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM masks")
            _mask_cache = [row_to_mask(row) for row in cursor.fetchall()]
            _mask_cache_mtime_ns = current_mtime_ns
        finally:
            conn.close()

    return _mask_cache


def get_cached_try_on_templates():
    """Load and validate the versioned Try-On manifest."""
    global _try_on_cache, _try_on_cache_mtime_ns

    current_mtime_ns = os.stat(TRY_ON_MANIFEST_PATH).st_mtime_ns
    if _try_on_cache is None or _try_on_cache_mtime_ns != current_mtime_ns:
        with open(TRY_ON_MANIFEST_PATH, encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)

        templates = manifest.get("templates", [])
        required_fields = {
            "id",
            "mask_id",
            "name",
            "version",
            "release_channel",
            "topology_version",
            "atlas_url",
            "asset_sha256",
            "thumbnail_url",
            "layers",
            "pose_limits",
            "cultural_review",
            "license",
        }

        template_ids = set()
        mask_ids = set()
        for template in templates:
            missing = required_fields.difference(template)
            if missing:
                missing_list = ", ".join(sorted(missing))
                raise ValueError(f"Try-On template {template.get('id', '<unknown>')} is missing: {missing_list}")
            if not template["atlas_url"].startswith("/try-on/templates/"):
                raise ValueError(f"Try-On template {template['id']} has an invalid atlas path")
            digest = template["asset_sha256"]
            if len(digest) != 64 or any(character not in "0123456789abcdef" for character in digest):
                raise ValueError(f"Try-On template {template['id']} has an invalid asset SHA-256")
            if template["topology_version"] != "mediapipe_face_468_v1":
                raise ValueError(f"Try-On template {template['id']} has an unsupported topology")
            if not isinstance(template["layers"], list) or not template["layers"]:
                raise ValueError(f"Try-On template {template['id']} must define at least one layer")
            pose_limits = template["pose_limits"]
            if not isinstance(pose_limits, dict) or not isinstance(pose_limits.get("yaw"), (int, float)) or not isinstance(pose_limits.get("pitch"), (int, float)):
                raise ValueError(f"Try-On template {template['id']} has invalid pose limits")
            if template["id"] in template_ids:
                raise ValueError(f"Duplicate Try-On template id: {template['id']}")
            if template["mask_id"] in mask_ids:
                raise ValueError(f"Duplicate Try-On mask_id: {template['mask_id']}")
            template_ids.add(template["id"])
            mask_ids.add(template["mask_id"])

        _try_on_cache = {
            "schema_version": manifest.get("schema_version", 1),
            "templates": templates,
        }
        _try_on_cache_mtime_ns = current_mtime_ns

    return _try_on_cache


def get_runtime_try_on_templates():
    """Expose every gallery mask as a source-faithful geometry-warp template.

    The small authored SVG manifest remains validated as an immutable archive,
    while the live catalogue uses each mask's own gallery image. Existing pilot
    ids are preserved so analytics, deep links, and regression fixtures remain
    stable.
    """
    authored_templates = get_cached_try_on_templates()["templates"]
    authored_by_mask_id = {item["mask_id"]: item for item in authored_templates}
    runtime_templates = []

    for mask in get_cached_masks():
        authored = authored_by_mask_id.get(mask["id"])
        template_id = authored["id"] if authored else f"{mask['id'].lower()}_v1"
        pose_limits = authored["pose_limits"] if authored else {"yaw": 32, "pitch": 22}
        cultural_review = dict(authored["cultural_review"]) if authored else {
            "status": "gallery_source_pending_expert_review",
            "source_mask_id": mask["id"],
        }
        cultural_review["source_mask_id"] = mask["id"]

        runtime_templates.append({
            "id": template_id,
            "mask_id": mask["id"],
            "name": mask["name"],
            "version": authored["version"] if authored else 1,
            "release_channel": "technical_pilot",
            "topology_version": "mediapipe_face_468_v1",
            "texture_source": "gallery_image",
            "source_image_url": mask["image_url"],
            "thumbnail_url": mask["image_url"],
            "accent": authored.get("accent", "#ebe5ce") if authored else "#ebe5ce",
            "layers": [{
                "id": "gallery_mask",
                "region": "face",
                "blend_mode": "normal",
                "occlusion_policy": "face_mesh",
            }],
            "pose_limits": pose_limits,
            "cultural_review": cultural_review,
            "license": dict(authored["license"]) if authored else {
                "asset_owner": "project",
                "usage": "technical_pilot",
            },
        })

    return runtime_templates


# ---------------------------------------------------------------------------
# GET /api/masks
# ---------------------------------------------------------------------------
@app.get("/api/masks")
async def get_masks():
    try:
        return get_cached_masks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /api/masks/{id}
# ---------------------------------------------------------------------------
@app.get("/api/masks/{mask_id}")
async def get_mask(mask_id: str):
    try:
        mask = next((item for item in get_cached_masks() if item["id"] == mask_id), None)
        if not mask:
            raise HTTPException(status_code=404, detail="Mask not found")
        return mask
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /api/try-on/templates
# GET /api/try-on/templates/{template_id}
# ---------------------------------------------------------------------------
@app.get("/api/try-on/templates")
async def get_try_on_templates():
    try:
        manifest = get_cached_try_on_templates()
        return {
            "data": get_runtime_try_on_templates(),
            "schema_version": manifest["schema_version"],
            "status": "ok",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/try-on/templates/{template_id}")
async def get_try_on_template(template_id: str):
    try:
        templates = get_runtime_try_on_templates()
        template = next((item for item in templates if item["id"] == template_id), None)
        if not template:
            raise HTTPException(status_code=404, detail="Try-On template not found")
        return {"data": template, "status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TryOnEvent(BaseModel):
    """Strict pixel-free analytics contract; collection is disabled by default."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event: Literal[
        "try_on_opened",
        "camera_granted",
        "first_render",
        "capture_completed",
        "export_completed",
        "session_failed",
    ]
    release_channel: Literal["internal", "invited_pilot", "technical_pilot", "public"]
    template_id: str | None = Field(default=None, pattern=r"^[a-z0-9_]+_v[0-9]+$")
    duration_ms: int | None = Field(default=None, ge=0, le=3_600_000)
    reason_code: Literal[
        "permission_denied",
        "camera_missing",
        "camera_busy",
        "unsupported_browser",
        "model_init_failed",
        "parser_unavailable",
        "unknown",
    ] | None = None
    parser_provider: Literal["webgpu", "wasm", "unavailable"] | None = None
    renderer_fps_bucket: Literal["below_15", "15_to_23", "24_to_29", "30_plus"] | None = None


@app.post("/api/try-on/events")
async def post_try_on_event(event: TryOnEvent):
    if not TRY_ON_METRICS_ENABLED:
        raise HTTPException(status_code=404, detail="Try-On metrics are disabled")
    # Intentionally no raw payload persistence in the technical pilot. A future
    # aggregate sink may receive only this validated, allowlisted model dump.
    return {"data": {"accepted": True, "event": event.event}, "status": "ok"}


# ---------------------------------------------------------------------------
# POST /api/masks/match  — Euclidean-distance personality matcher
# ---------------------------------------------------------------------------
class MatchPayload(BaseModel):
    strength: int
    intellect: int
    spirit: int
    ferocity: int


@app.post("/api/masks/match")
async def match_mask(payload: MatchPayload):
    try:
        masks = get_cached_masks()

        if not masks:
            raise HTTPException(status_code=404, detail="No masks in database")

        best_mask = None
        best_distance = float("inf")

        for mask in masks:
            stats = mask["stats"]
            dist = math.sqrt(
                (payload.strength  - stats.get("strength",  50)) ** 2 +
                (payload.intellect - stats.get("intellect", 50)) ** 2 +
                (payload.spirit    - stats.get("spirit",    50)) ** 2 +
                (payload.ferocity  - stats.get("ferocity",  50)) ** 2
            )
            if dist < best_distance:
                best_distance = dist
                best_mask = mask

        return {
            "data": best_mask,
            "distance": round(best_distance, 2),
            "status": "ok"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
