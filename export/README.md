# Ethan Tiong — Portfolio Shell (export)

Structural React + Tailwind shell. Cream paper / black ink / deep seal-red accent.
The fixed `<canvas>` is a **placeholder** — a WebGL ink-fluid simulation mounts there later.

## Files
- `Portfolio.jsx` — the page component (default export). All copy/data is placeholder.
- `tailwind.config.js` — theme tokens: colors `paper` / `ink` / `seal`, fonts `display` / `sans` / `mono`, reveal/pulse keyframes.

## Setup
1. Drop both files into a React + Tailwind project (merge `tailwind.config.js` into yours).
2. Add the fonts to your `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500..900;1,9..144,500..900&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

3. Render `<Portfolio />`.

## Type hierarchy
- Hero name + final CTA: **Fraunces 900** (huge, heavy)
- Section headings: **Fraunces 700**
- Card / sub-headings: **Fraunces 600**
- Body: **IBM Plex Sans**
- Nav, labels, tags, coordinates, status: **IBM Plex Mono**
- `#7A1712` seal red: tiny dots, metadata markers, and the 九 seal only.

## Next step
Replace the body of the canvas `useEffect` in `Portfolio.jsx` with the WebGL ink-fluid renderer. Keep it `position: fixed; z-index: 0` behind all content.
