# Ethan Tiong — Portfolio

Personal portfolio for Ethan Tiong, an Electrical Engineering student at the University of Waterloo (embedded firmware, board-level hardware, signal/data systems).

A single-page site with a custom WebGL fluid-ink background ("ink in water") on a cream/ink, kitsune-inspired editorial aesthetic.

> **Status:** Design prototype / portfolio in progress. The project, notes, skills, and experience copy is temporary placeholder content pending a final design + content pass.

## Tech

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- Raw WebGL2 fluid simulation (no animation libraries) with a Canvas 2D fallback

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

## Ink background

The background (`src/components/FluidInkCanvas.jsx`) is a real-time WebGL2 fluid simulation: a small sharp ink "speck" follows the cursor and the velocity field carries it into large, thick, slowly diffusing plumes — ink injected into water.

It automatically falls back to a lighter Canvas 2D trail (`src/components/InkCanvas.jsx`) when WebGL2 is unavailable, and disables animation entirely under `prefers-reduced-motion`.

## Deployment

Static site — the build output is `dist/`.

- **Vercel:** zero config (auto-detects Vite). Build command `npm run build`, output directory `dist`.
- **Netlify:** configured in `netlify.toml` (build `npm run build`, publish `dist`).
