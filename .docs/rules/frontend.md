# rules/frontend.md — Rules for frontend/src/**

## Component Architecture
- Strictly use **Functional Components**.
- Naming convention: **PascalCase** for files and components (e.g., `GridView.jsx`).
- Single Responsibility: Each component does **one thing**. Separate business logic from UI rendering.
- **Data Fetching Rule**: Components MUST NOT call `fetch()` or any network API directly. All data fetching and backend communication MUST be delegated to functions in the `src/api/` layer (`maskService.js`, etc.).

## Styling (Tailwind CSS 4)
- Use pure **Tailwind CSS 4** classes. ZERO inline styles (unless required by Framer Motion dynamic values).
- **NEVER** hardcode hex colors. Use the CSS variables defined in `App.css`:
  - `bg-primary`, `text-primary` (mapped to Red: `#ff1919`)
  - `bg-tertiary`, `border-tertiary` (mapped to Cream: `#ebe5ce`)
  - Backgrounds are strictly Black: `#0a0a0a`.

## Animations (Framer Motion)
- Use **Framer Motion** for ALL animations. No manual CSS `@keyframes`.
- Default UI transition: `{ duration: 0.3, ease: "easeOut" }`.
- Use `spring` physics exclusively for interactive elements (custom cursor, draggable sliders, eye-tracking).

## Strict Import Order
1. React imports (`useState`, `useEffect`, etc.)
2. Third-party libraries (`framer-motion`, etc.)
3. Internal custom components
4. Assets (images, icons)
5. Styles (`.css` files)
