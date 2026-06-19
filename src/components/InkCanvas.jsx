import { useEffect, useRef } from 'react';

/* -----------------------------------------------------------
 * InkCanvas — foundation pass, v5.
 *
 * Fixes the v4 cursor-lag: previously every mousemove pushed
 * segments, mousemove fires >60 Hz on many mice, the trails
 * array grew faster than rAF could drain it, and rendering
 * fell behind the cursor.
 *
 * Architecture now:
 *  · mousemove ONLY updates a {targetX, targetY, targetT} latch.
 *    It does not push segments.
 *  · The rAF loop is the single producer of segments. Each tick:
 *      synth(): catch up from (renderX, renderY) to the current
 *               target, capped at MAX_STEPS_PER_FRAME segments.
 *               Then renderX/Y jump to target — no backlog.
 *      expire: drop trails whose age ≥ lifetime.
 *      [draw is throttled by frameInterval; synth/expire are not]
 *      draw:   stroke each segment with its own age-based alpha.
 *      blur:   single-pass blur of the small buffer into tctx.
 *      composite: cream → blurred ink → wash → vignette.
 *  · When target == render AND trails is empty, cancel rAF.
 *
 * Huge per-frame jumps are bounded by step count, not distance:
 * the trail covers at most MAX_STEPS_PER_FRAME × TARGET_STEP_LEN
 * of the move and lets the cursor leave a gap. Short tight trail
 * stays put — no long bars snapping across.
 *
 * Ghost-safe model from v4 preserved: every segment owns its own
 * (born, lifetime); alpha is f(now - born) only.
 * --------------------------------------------------------- */

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TUNING = {
  MAX_SEGMENTS:        512,    // hard cap on trail length
  MAX_STEPS_PER_FRAME: 4,      // segments produced per rAF tick — protects against backlog
  TRAIL_LIFETIME:      1800,   // ms per segment
  TRAIL_OPACITY:       0.08,   // peak alpha at age=0 (subtle / readable)
  TRAIL_WIDTH:         56,     // stroke lineWidth in display px (before age-taper + jitter)
  BLUR_AMOUNT:         7,      // buffer-space blur kernel in buffer px
  MAX_DPR:             1.5,    // display canvas DPR cap
  MOBILE_SCALE:        0.45,   // buffer resolution scale on mobile
};

const FADE_STRENGTH        = 2.5;    // age-curve exponent
const DESKTOP_BUFFER_SCALE = 0.6;    // buffer resolution scale on desktop
const MOBILE_BREAKPOINT    = 820;
const MOBILE_FPS           = 30;
const TARGET_STEP_LEN      = 18;     // CSS px between sub-segment points (when not capped)
const GAP_THRESHOLD_MS     = 220;    // mouse-presence gap above which we teleport instead of bridging
const MIN_SEGMENT_DIST     = 1.0;    // CSS px — ignore tiny jitter

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

    // Two offscreen surfaces: inkBuffer holds sharp strokes; tempBuffer holds
    // the blurred copy used for compositing. Single blur pass per frame.
    const inkBuffer  = document.createElement('canvas');
    const bctx = inkBuffer.getContext('2d');
    const tempBuffer = document.createElement('canvas');
    const tctx = tempBuffer.getContext('2d');

    let cssW = 0;
    let cssH = 0;
    let bw   = 0;
    let bh   = 0;
    let bScaleX = 0;
    let bScaleY = 0;
    let washGradient     = null;
    let vignetteGradient = null;
    let raf = 0;

    /** @type {Array<{x1:number,y1:number,x2:number,y2:number,born:number,lifetime:number,opacity:number,width:number}>} */
    const trails = [];

    // Latched target (written by mousemove) and last-synthesized "render head"
    // (written by the loop). All coords in CSS px, timestamps in performance.now() units.
    let targetX = null;
    let targetY = null;
    let targetT = null;
    let renderX = null;
    let renderY = null;
    let renderT = null;

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

      // tempBuffer holds the already-blurred ink. Bilinear upscale adds extra softening for free.
      ctx.drawImage(tempBuffer, 0, 0, cssW, cssH);

      ctx.fillStyle = washGradient;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, cssW, cssH);
    };

    const renderCleanFrame = () => {
      bctx.clearRect(0, 0, bw, bh);
      tctx.clearRect(0, 0, bw, bh);
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
      inkBuffer.width   = bw;
      inkBuffer.height  = bh;
      tempBuffer.width  = bw;
      tempBuffer.height = bh;
      bScaleX = bw / cssW;
      bScaleY = bh / cssH;

      rebuildOverlays();
      renderCleanFrame();
    };

    // Catch up the render head to the target. Bounded by MAX_STEPS_PER_FRAME so
    // it cannot backlog. On huge jumps we cover only a short stretch and let
    // renderX teleport to target — a short trail "stays put" rather than a long
    // stretched bar snapping across the page.
    const synthesizeToTarget = () => {
      if (renderX === null || targetX === null) return;
      if (targetX === renderX && targetY === renderY) return;

      // Long gap = mouse was off-window or tab paused; don't bridge.
      if (targetT - renderT > GAP_THRESHOLD_MS) {
        renderX = targetX;
        renderY = targetY;
        renderT = targetT;
        return;
      }

      const dx = targetX - renderX;
      const dy = targetY - renderY;
      const distSq = dx * dx + dy * dy;
      if (distSq < MIN_SEGMENT_DIST * MIN_SEGMENT_DIST) return;

      const dist = Math.sqrt(distSq);
      const fullSteps = Math.max(1, Math.ceil(dist / TARGET_STEP_LEN));
      const numSteps = Math.min(TUNING.MAX_STEPS_PER_FRAME, fullSteps);
      const coveredDist = Math.min(dist, numSteps * TARGET_STEP_LEN);
      const stepLen = coveredDist / numSteps;
      const ux = dx / dist;
      const uy = dy / dist;
      const dt = targetT - renderT;

      for (let i = 0; i < numSteps; i++) {
        const d0 = i * stepLen;
        const d1 = (i + 1) * stepLen;
        const fracBorn = (i + 0.5) / numSteps;
        trails.push({
          x1: renderX + ux * d0,
          y1: renderY + uy * d0,
          x2: renderX + ux * d1,
          y2: renderY + uy * d1,
          born: renderT + dt * fracBorn,
          lifetime: TUNING.TRAIL_LIFETIME,
          opacity: TUNING.TRAIL_OPACITY * (0.8 + Math.random() * 0.4),
          width: TUNING.TRAIL_WIDTH * (0.85 + Math.random() * 0.3),
        });
        if (trails.length > TUNING.MAX_SEGMENTS) trails.shift();
      }

      // Teleport so next frame catches up from the cursor's current spot — no backlog.
      renderX = targetX;
      renderY = targetY;
      renderT = targetT;
    };

    const expireSegments = (time) => {
      while (trails.length > 0 && time - trails[0].born >= trails[0].lifetime) {
        trails.shift();
      }
    };

    const drawAndComposite = (time) => {
      bctx.clearRect(0, 0, bw, bh);

      if (trails.length === 0) {
        tctx.clearRect(0, 0, bw, bh);
        compositeToDisplay();
        return;
      }

      bctx.lineCap = 'round';
      bctx.lineJoin = 'round';
      bctx.filter = 'none';
      const minScale = Math.min(bScaleX, bScaleY);

      for (let i = 0; i < trails.length; i++) {
        const seg = trails[i];
        const age = (time - seg.born) / seg.lifetime;
        if (age < 0 || age >= 1) continue;
        const fade = Math.pow(1 - age, FADE_STRENGTH);
        const alpha = seg.opacity * fade;
        if (alpha < 0.002) continue;
        const lineW = seg.width * (0.35 + 0.65 * fade) * minScale;

        bctx.strokeStyle = `rgba(34,28,22,${alpha})`;
        bctx.lineWidth = lineW;
        bctx.beginPath();
        bctx.moveTo(seg.x1 * bScaleX, seg.y1 * bScaleY);
        bctx.lineTo(seg.x2 * bScaleX, seg.y2 * bScaleY);
        bctx.stroke();
      }

      // Single-pass blur: cheap because the buffer is small (~1152×648 desktop).
      tctx.clearRect(0, 0, bw, bh);
      tctx.filter = `blur(${TUNING.BLUR_AMOUNT}px)`;
      tctx.drawImage(inkBuffer, 0, 0);
      tctx.filter = 'none';

      compositeToDisplay();
    };

    const loop = (time) => {
      // Responsiveness path — runs on EVERY rAF tick even when the draw is
      // throttled. Captures the latest target and times out old segments
      // without any FPS gate.
      synthesizeToTarget();
      expireSegments(time);

      // Idle? Stop the loop entirely; mousemove will resume it.
      if (
        trails.length === 0 &&
        (targetX === null || (targetX === renderX && targetY === renderY))
      ) {
        // One last clean frame so the display matches the empty state.
        bctx.clearRect(0, 0, bw, bh);
        tctx.clearRect(0, 0, bw, bh);
        compositeToDisplay();
        raf = 0;
        return;
      }

      // Draw is FPS-capped (mobile) — the responsiveness path above already ran.
      if (frameInterval && time - lastFrame < frameInterval) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastFrame = time;

      drawAndComposite(time);
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (!raf && !document.hidden) {
        raf = requestAnimationFrame(loop);
      }
    };

    const onMouseMove = (e) => {
      const now = performance.now();
      if (targetT === null) {
        // First sighting — pin render to target so we don't draw a long line
        // from (0,0) to wherever the cursor showed up.
        targetX = renderX = e.clientX;
        targetY = renderY = e.clientY;
        targetT = renderT = now;
      } else {
        targetX = e.clientX;
        targetY = e.clientY;
        targetT = now;
      }
      startLoop();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        trails.length = 0;
        targetX = targetY = targetT = null;
        renderX = renderY = renderT = null;
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
