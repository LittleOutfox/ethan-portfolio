/* Re-bakes the fox glow layers (assets/kitsune/*-bloom{,2}.webp).
   Run whenever a pose SVG changes:
     1. python3 -m http.server 8000            (from the repo root)
     2. open http://localhost:8000/assets/ in Chrome, paste this file
        into the DevTools console
     3. it returns JSON of data-URLs — save each as
        assets/kitsune/<name>-bloom.webp / -bloom2.webp
   The filters below must stay in sync with the live-filter rules in
   css/styles.css (.spirit-mount img.bloom / .bloom2), and the pad
   fractions (4% / 8%) with the [data-baked] negative insets there. */
(async () => {
  const poses = { bowing: [665, 592], descending: [232, 533], diving: [399, 721],
                  howling: [546, 569], sitting: [674, 502], standing: [450, 750], walking: [630, 404] };
  const out = {};
  for (const [name, wh] of Object.entries(poses)) {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = '/assets/kitsune/' + name + '.svg'; });
    const CW = 600, CH = Math.round(600 * wh[1] / wh[0]);
    const make = (padFrac, filter, q) => {
      const px = Math.round(CW * padFrac), py = Math.round(CH * padFrac);
      const c = document.createElement('canvas');
      c.width = CW + 2 * px; c.height = CH + 2 * py;
      const x = c.getContext('2d');
      x.filter = filter;
      x.drawImage(img, px, py, CW, CH);
      return c.toDataURL('image/webp', q);
    };
    out[name] = {
      bloom: make(0.04, 'invert(1) brightness(1.6) blur(5px)', 0.9),
      bloom2: make(0.08, 'invert(1) brightness(2) blur(16px)', 0.85)
    };
  }
  return JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { bloom: v.bloom.length, bloom2: v.bloom2.length }]))) + '|||' + JSON.stringify(out);
})()
