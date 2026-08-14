from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import math
import os

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
_mask_cache = None
_mask_cache_mtime_ns = None

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
