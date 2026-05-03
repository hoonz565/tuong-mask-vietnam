# Frontend Architecture & Plans

## Core Tech Stack
- React (Vite) + Tailwind CSS 4 + Framer Motion.
- Backend: API serves 117 masks via SQLite (`masks.db`) and Python FastAPI.

## Current System State (Implemented Features)
- **Hero Section:** Utopia Tokyo style (3-columns, "TUONG" watermark, coordinate bar, interactive spring-physics eye-tracking on mask image).
- **Gallery Layout:** `GalleryToolbar` for Grid/List toggle. 10-column dense grid (`gap-0`) with animated L-shaped corner markers. Custom "Tracking Point" reticle cursor.
- **Detailed View:** Persistent 3-part layout (Preview, Mini-Grid, Data Registry). In-place text transitions. 10-segment block-style stat bars.
- **Discover Your Mask:** Full-screen cyberpunk HUD feature. 3 stages: Sliders/Radar (Stage 1), Terminal Loading (Stage 2), Reveal (Stage 3). Includes Euclidean distance matching API logic.
- **[DONE] API Service Layer Refactor:** Created `src/api/client.js` (base URL, envelope unwrapping, error logging) and `src/api/maskService.js` (`getAllMasks`, `getMaskById`, `matchMask`). Removed all raw `fetch()` calls from `App.jsx`, `DiscoverMask.jsx`, and `DetailedView.jsx`. Updated `rules/frontend.md` with the Data Fetching Rule.
