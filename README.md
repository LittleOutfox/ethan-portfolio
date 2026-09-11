# etiong.com

The portfolio of **Ethan Tiong**: Electrical Engineering at the University of Waterloo, RTL design for ASIC and FPGA. Live at [www.etiong.com](https://www.etiong.com/).

## What is on the page

- A title block a recruiter can read in seconds: name, discipline, program, location, availability, résumé, GitHub, LinkedIn, email.
- Experience as a chronological ledger, projects with measured parameters, a UART timing figure drawn from a unit-tested frame generator, skills, and contact.
- One WebGL moment: the nine-tailed fox from my own line drawings, rebuilt as a field of points. It forms in the hero, releases into signal traces and snow as you scroll, and gathers again beside the contact block. Light travels along the drawn strokes; touching the fox sends a pulse through it.

## Stack

Vite, React 19, TypeScript, Three.js with React Three Fiber, GSAP ScrollTrigger. CSS Modules over a small token layer. The page is prerendered to static HTML at build time, so every section is readable before JavaScript runs and with WebGL unavailable.

Self-hosted type: Newsreader (display), Schibsted Grotesk (text), Azeret Mono (measurements only).

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # client build + SSR build + prerender into dist/
npm run preview
npm test           # sampler and UART generator tests
npm run lint
npm run bake       # rebake the fox masks from art/kitsune/*.svg
npm run fonts      # re-instance and subset the fonts (needs pip install fonttools brotli)
npm run favicons   # cut the favicons from the drawing
```

While the dev server runs, `/spike.html?n=40000&a=sitting&b=bowing` renders the point field alone with sliders for the two poses, the moon, and reduced motion. Query parameters on the main page: `?tier=high|medium|low|none` forces a device tier and `?motion=reduce` forces the reduced-motion path.

## How the fox works

`scripts/bake-fox-masks.mjs` rasterizes each drawing and bakes a small mask: a density-normalized ink weight (thin whiskers and heavy tail masses get proportionate points), a geodesic distance from the nose along the strokes, and raw ink. At runtime a worker draws stratified samples from the mask and Hilbert-sorts them so the two poses correspond point for point. One `THREE.Points` with a screen-space shader does the rest: per-point formation thresholds from the geodesic channel (tail tips release first, the nose last), an idle nose-to-tail luminance pulse, a pointer pulse, and a moon whose position is shared between the CSS wash and the shader.

Devices are tiered once before the WebGL chunk is requested; phones and weak GPUs get fewer points and a hero-only field, and anything without WebGL2 keeps the posters. A persistent Pause motion control and the reduced-motion preference both stop the loop.

## Accessibility

Semantic landmarks, one heading order, a skip link, visible two-tone focus, 44 px targets, a native dialog for the phone menu, prerendered content, and a pause control for the continuous field.

## Provenance

The seven fox drawings in `art/kitsune/` are original. Designed and built by hand.
