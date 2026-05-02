# rules/api.md — Rules for backend/**

## Applies to: `backend/**`

## Endpoint Conventions
- All routes MUST be prefixed with `/api/` (e.g., `/api/masks`, `/api/masks/match`).
- Use **snake_case** for all JSON response field names.
- Return a consistent response envelope for successful requests:
  ```json
  {
    "data": {}, // or [] for lists
    "status": "ok"
  }

## Database
- Use SQLite (`masks.db`) — do not migrate to another DB until necessary
- Seed script: `backend/init_db.py`
- No raw SQL — use SQLAlchemy ORM or sqlite3 with parameterized queries

## CORS
- Allowed origin (dev): `http://localhost:5173` (Vite dev server)
- Production: update allowed origins once a real domain is available

## Standard Mask Object Shape
```json
{
  "id": "ac_ba",
  "name": "Ác Ba",
  "category": "Tuồng Cổ",
  "image_url": "/static/images/1.png",
  "description": "...",
  "stats": {
    "strength": 85,
    "intellect": 40,
    "spirit": 60,
    "ferocity": 90
  }
}
```
