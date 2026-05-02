from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import math
import os

app = FastAPI(title="Vietnamese Tuong Mask API")

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), 'masks.db')

# Ensure static/images directory exists
os.makedirs(os.path.join(os.path.dirname(__file__), 'static', 'images'), exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), 'static')), name="static")


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


# ---------------------------------------------------------------------------
# GET /api/masks
# ---------------------------------------------------------------------------
@app.get("/api/masks")
async def get_masks():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM masks")
        masks = cursor.fetchall()
        return [row_to_mask(m) for m in masks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/masks/{id}
# ---------------------------------------------------------------------------
@app.get("/api/masks/{mask_id}")
async def get_mask(mask_id: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM masks WHERE id = ?", (mask_id,))
        mask = cursor.fetchone()
        if not mask:
            raise HTTPException(status_code=404, detail="Mask not found")
        return row_to_mask(mask)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


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
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM masks")
        masks = cursor.fetchall()

        if not masks:
            raise HTTPException(status_code=404, detail="No masks in database")

        best_mask = None
        best_distance = float("inf")

        for row in masks:
            m = dict(row)
            dist = math.sqrt(
                (payload.strength  - m.get("strength",  50)) ** 2 +
                (payload.intellect - m.get("intellect", 50)) ** 2 +
                (payload.spirit    - m.get("spirit",    50)) ** 2 +
                (payload.ferocity  - m.get("ferocity",  50)) ** 2
            )
            if dist < best_distance:
                best_distance = dist
                best_mask = row

        return {
            "data": row_to_mask(best_mask),
            "distance": round(best_distance, 2),
            "status": "ok"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
