# Design System & Aesthetic Guidelines

## Core Aesthetic
- **Theme:** Neo-Heritage Cyberpunk, heavily inspired by Utopia Tokyo.
- **Palette:** Dark mode. Background black/dark gray. Typography/Accents: Primary Red (`#ff1919`) and Cream (`#ebe5ce`).
- **Typography:** `PPMori` / monospace. Oversized stacked titles, tracking-widest, and vertical text (`writing-mode`).

## Key Design Patterns
- **Cyberpunk Elements:** Red scan lines, crosshair grid backgrounds, tech labels (`DATA_001`), glowing reticles.
- **Borders & Framing:** Avoid standard solid borders. Strictly use L-shaped corner brackets `[ ]`, targeting bounding boxes, and mechanical slider tracks.
- **Animations (Framer Motion):**
  - Mechanical, snappy feel: `cubic-bezier(0.25, 1, 0.5, 1)`.
  - Heavy-industrial layout shifts: 0.8s duration.
  - Spring physics for interactive elements (custom cursor, Hero eye-tracking).
