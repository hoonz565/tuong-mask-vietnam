# Backend Architecture & Plans

## Core Tech Stack
- Python + FastAPI.
- Database: SQLite (`masks.db`) initialized via `init_db.py`.
- Validation: Pydantic `BaseModel`.

## Current System State (Implemented Features)
- **Database (`masks.db`):** 
  - Contains 117 unique Tuong masks.
  - Schema includes: `id`, `name`, `category`, `image_url` (relative paths), and 4 integer stats (`strength`, `intellect`, `spirit`, `ferocity`).
- **Static Assets:** Serving images at `/static/images/` (including `watcher.png` for Frontend Hero section) with CORS enabled.
- **API Endpoints:**
  - `GET /api/masks`: Returns all masks. Uses `row_to_mask()` helper to nest stat columns into a structured `stats: {}` object.
  - `GET /api/masks/{mask_id}`: Returns a single mask by ID.
  - `POST /api/masks/match`: The "Discover Your Mask" engine. Accepts a payload of 4 stats. Uses **Euclidean Distance** formula to compare the user's vector against all masks in the database and returns the closest match `{"data": {...}, "distance": float, "status": "ok"}`.
- **Error Handling:** Standardized using FastAPI's `HTTPException`.
