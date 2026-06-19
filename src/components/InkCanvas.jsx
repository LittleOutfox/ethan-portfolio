import { useEffect, useRef } from 'react';

/* -----------------------------------------------------------
 * InkCanvas — foundation pass, v4.
 *
 * v3 had a ghosting bug: a single gradient stroke tied alpha to
 * POSITION on the oldest→newest axis, so old points the cursor
 * revisited landed at the bright end and re-lit. Fixed here by
 * making every trail segment own its own age, totally independent
 * of every other segment.
 *
 * Per frame:
 *  · drop expired segments from the array head
 *  · clearRect the offscreen buffer (no leftover alpha by construction)
 *  · iterate surviving segments, stroke each ONE line based on its
 *    own (born, lifetime) — alpha is a pure function of own age
 *  · compositeToDisplay (cream → blurred buffer upscale → wash → vignette)
 *  · when the array empties, cancel RAF — mousemove restarts it
 *
 * Beading at slow-cursor vertices is mitigated, not architected away:
 * low TRAIL_OPACITY + blur. Width and opacity jitter give organic feel
 * without the position-bound bug. Lifetime is INTENTIONALLY constant
 * across segments so the array stays sorted by expiration and head-only
 * shift cleanup is correct.
 *
 * Next aesthetic lever (if it still reads as a line): 2–3 perpendicular-
 * offset sub-strokes per segment. Not in v4; document for the user.
 * --------------------------------------------------------- */

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TUNING = {
  TRAIL_OPACITY:       0.10,   // peak per-segment opacity at age=0
  TRAIL_RADIUS:        28,     // half-width of stroke in display px (lineWidth = 2 × this × age-taper × jitter)
  FADE_STRENGTH:       2.5,    // age-curve exponent — higher = quicker drop near the tail
  TRAIL_LIFETIME_FEEL: 2200,   // ms — per-segment lifetime (kept constant across segments for sorted expiry)
  MAX_DPR:             1.5,
  MOBILE_SCALE:        0.45,
};

const DESKTOP_BUFFER_SCALE = 0.6;
const MOBILE_BREAKPOINT    = 820;
const MOBILE_FPS           = 30;
const BLUR_AMOUNT          = 6;    // display-space blur on the buffer upscale — softens edges
const MAX_SEGMENTS         = 256;  // hard cap (≈4 s of 60 Hz mousemove). Oldest is dropped when over.
const GAP_THRESHOLD_MS     = 220;  // skip segment creation if mouse "teleported" (leave/reenter, tab switch)
const MIN_SEGMENT_DIST     = 1.0;  // CSS px — ignore tiny jitter so we don't pile zero-length strokes

export default function InkCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile     = window.innerWidth < MOBILE_BREAKPOINT;
    const bufferScale  = isMobile ? TUNING.MOBILE_SCALE : DESKTOP_BUFFER_SCALE;
    const cursorEnabled = !isMobile && !reduceMotion;

    const inkBuffer = document.createElement('canvas');
    const bctx = inkBuffer.getContext('2d');

    let cssW = 0;
    let cssH = 0;
    let bw   = 0;
    let bh   = 0;
    let bScaleX = 0;
    let bScaleY = 0;
    let washGradient     = null;
    let vignetteGradient = null;
    let raf = 0;

    // Trail segments. Each owns its own birth/lifetime/visual params. Ages are
    // computed from `born` only — never from siblings or cursor position.
    /** @type {Array<{x1:number,y1:number,x2:number,y2:number,born:number,lifetime:number,opacity:number,width:number}>} */
    const trails = [];

    // Last mousemove anchor (for forming the next segment's start point).
    let lastX = null;
    let lastY = null;
    let lastT = null;

    const frameInterval = isMobile ? 1000 / MOBILE_FPS : 0;
    let lastFrame = 0;

    const rebuildOverlays = () => {
      washGradient = ctx.createLinearGradient(0, 0, cssW, 0);
      washGradient.addColorStop(0,   'rgba(244,241,233,0.35)');
      washGradient.addColorStop(0.5, 'rgba(244,241,233,0.78)');
      washGradient.addColorStop(1,   'rgba(244,241,233,0.35)');

      vignetteGradient = ctx.createRadialGradient(
        cssW / 2, cssH * 0.46, Math.min(cssW, cssH) * 0.18,
        cssW / 2, cssH * 0.5,  Math.max(cssW, cssH) * 0.78,
      );
      vignetteGradient.addColorStop(0, 'rgba(244,241,233,0)');
      vignetteGradient.addColorStop(1, 'rgba(120,104,82,0.1)');
    };

    const compositeToDisplay = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.filter = 'none';

      ctx.fillStyle = '#f4f1e9';
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.filter = `blur(${BLUR_AMOUNT}px)`;
      ctx.drawImage(inkBuffer, 0, 0, cssW, cssH);
      ctx.filter = 'none';

      ctx.fillStyle = washGradient;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, cssW, cssH);
    };

    const renderCleanFrame = () => {
      bctx.clearRect(0, 0, bw, bh);
      compositeToDisplay();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, TUNING.MAX_DPR);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      bw = Math.max(1, Math.floor(cssW * bufferScale));
      bh = Math.max(1, Math.floor(cssH * bufferScale));
      inkBuffer.width  = bw;
      inkBuffer.height = bh;
      bScaleX = bw / cssW;
      bScaleY = bh / cssH;

      rebuildOverlays();
      renderCleanFrame();
    };

    /**
     * One frame. Returns true when the trail list is empty so the loop can stop.
     */
    const renderFrame = (time) => {
      // Constant lifetime ⇒ array sorted by expiration ⇒ head-only shift is correct.
      while (trails.length > 0 && time - trails[0].born >= trails[0].lifetime) {
        trails.shift();
      }

      // Full reset — by construction no buffer alpha survives between frames.
      bctx.clearRect(0, 0, bw, bh);

      if (trails.length === 0) {
        compositeToDisplay();
        return true;
      }

      bctx.lineCap = 'round';
      bctx.lineJoin = 'round';
      const minScale = Math.min(bScaleX, bScaleY);

      for (let i = 0; i < trails.length; i++) {
        const seg = trails[i];
        const age = (time - seg.born) / seg.lifetime;
        if (age < 0 || age >= 1) continue;
        const fade = Math.pow(1 - age, TUNING.FADE_STRENGTH);
        const alpha = seg.opacity * fade;
        if (alpha < 0.002) continue;
        // Width tapers with age so older segments thin out — comet feel, not a uniform pipe.
        const lineW = seg.width * (0.35 + 0.65 * fade) * minScale;

        bctx.strokeStyle = `rgba(34,28,22,${alpha})`;
        bctx.lineWidth = lineW;
        bctx.beginPath();
        bctx.moveTo(seg.x1 * bScaleX, seg.y1 * bScaleY);
        bctx.lineTo(seg.x2 * bScaleX, seg.y2 * bScaleY);
        bctx.stroke();
      }

      compositeToDisplay();
      return false;
    };

    const loop = (time) => {
      if (frameInterval && time - lastFrame < frameInterval) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastFrame = time;
      const done = renderFrame(time);
      if (done) {
        raf = 0;
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const startLoop = () => {
      if (!raf && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onMouseMove = (e) => {
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;

      // Gap detector: skip segment creation if it would span a leave/reenter or
      // a tab-switch pause — those would draw a long line across the page.
      if (lastT !== null && now - lastT <= GAP_THRESHOLD_MS) {
        const dx = x - lastX;
        const dy = y - lastY;
        if (dx * dx + dy * dy >= MIN_SEGMENT_DIST * MIN_SEGMENT_DIST) {
          trails.push({
            x1: lastX,
            y1: lastY,
            x2: x,
            y2: y,
            born: now,
            lifetime: TUNING.TRAIL_LIFETIME_FEEL,
            opacity: TUNING.TRAIL_OPACITY * (0.8 + Math.random() * 0.4),
            width: TUNING.TRAIL_RADIUS * 2 * (0.85 + Math.random() * 0.3),
          });
          if (trails.length > MAX_SEGMENTS) trails.shift();
        }
      }

      lastX = x;
      lastY = y;
      lastT = now;
      startLoop();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        // Toss any accumulated state so we don't replay a stale trail on return.
        trails.length = 0;
        lastX = null;
        lastY = null;
        lastT = null;
        renderCleanFrame();
      }
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduceMotion) {
      return () => {
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }

    if (cursorEnabled) {
      window.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (cursorEnabled) {
        window.removeEventListener('mousemove', onMouseMove);
      }
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none block"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN_URL }}
      />
    </>
  );
}
