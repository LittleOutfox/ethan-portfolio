import { useEffect, useRef, useState } from 'react';

import InkCanvas from './InkCanvas.jsx';

/* -----------------------------------------------------------
 * FluidInkCanvas — 2D incompressible fluid simulation
 * inspired by PavelDoGreat/WebGL-Fluid-Simulation (Stam splat).
 *
 * Pipeline per frame:
 *   splat queue → curl → vorticity → divergence → pressure (Jacobi)
 *   → gradient subtract → advect velocity → advect dye → display.
 *
 * The dye texture stores monochrome ink density in the R channel;
 * the display pass paints it as premultiplied black on transparent
 * background so the page colour shows through.
 *
 * Cursor delta seeds the velocity field with a momentum splat;
 * a single dye splat is co-located, surrounded by 8 micro-velocity
 * "tails" with rotated kicks so the wake branches/curls into the
 * kitsune nine-tail silhouette without ever drawing 9 visible marks.
 *
 * Falls back to <InkCanvas /> when WebGL2 is unavailable or
 * prefers-reduced-motion is on.
 * --------------------------------------------------------- */

// ---------------------------------------------------------------
// PRESETS — switch via `?ink=foundation|sumi|kitsune` in the URL.
//
// Each preset bundles every behavior + render knob. The fixed
// engine-level constants (resolution, DPR, etc.) live in COMMON
// below so presets stay focused on the perceptual feel.
//
// Recommended default: SUMI_BLOOM.
// ---------------------------------------------------------------

const COMMON = {
  SIM_RESOLUTION:       128,
  DYE_RESOLUTION:       512,
  PRESSURE_ITERATIONS:  18,
  MAX_DPR:              1.5,
  MOBILE_DPR:           1.0,
  MOBILE_SCALE:         0.55,
};

// Per-preset emitter fields:
//   MIN_INK_DISTANCE   — px the cursor must move before any splat fires (small-move gate)
//   SLOW_SPEED, FAST_SPEED — px/sec; speed range that maps to the emitter scale curve
//   MIN_/MAX_DYE_LONG_RADIUS, MIN_/MAX_DYE_NARROW_RADIUS
//                      — Gaussian sigmas (along / across motion) interpolated by speed
//   MAX_NIB_ASPECT_RATIO — caps long ≤ narrow × ratio so the nib never becomes a spear
//   BACK_OFFSET_RATIO  — DYE_BACK_OFFSET as a fraction of the current long radius
//   DYE_FRONT_FADE     — 0..1 multiplier on dye in front of cursor (0 = no ink in front)
//   MIN_/MAX_DENSITY_AMOUNT — peak dye per emit, interpolated by speed
//   MIN_/MAX_FORCE     — velocity scalar applied to mouse delta, interpolated by speed
//   VELOCITY_RADIUS    — sigma of the (still circular) velocity injection
//   NIB_SPLIT          — number of parallel companion nibs (1 = single, 3 = kitsune trio)
//   NIB_SPREAD         — px perpendicular spread of companions; scales with speed
//   NIB_JITTER         — px random jitter; scales with speed; presets ship 0
//   DENSITY_VARIANCE   — ± per-emit dye amplitude; presets ship 0
//   DIRECTION_SMOOTHING — simple per-event lerp factor toward raw direction (light only)
//   MIN_DIRECTION_SPEED — px/sec; below this we freeze direction (avoids jitter)
//   DENSITY_DISSIPATION / VELOCITY_DISSIPATION / CURL_STRENGTH — sim fade & swirl
//   INK_OPACITY / DENSITY_ALPHA_CURVE / READABILITY_MASK_STRENGTH — render

const PRESETS = {
  foundation: {
    label:                 'FOUNDATION',
    MIN_INK_DISTANCE:      2.5,
    SLOW_SPEED:            200,
    FAST_SPEED:            2200,
    MIN_DYE_LONG_RADIUS:   0.012,
    MAX_DYE_LONG_RADIUS:   0.045,
    MIN_DYE_NARROW_RADIUS: 0.010,
    MAX_DYE_NARROW_RADIUS: 0.018,
    MAX_NIB_ASPECT_RATIO:  3.5,
    BACK_OFFSET_RATIO:     0.30,
    DYE_FRONT_FADE:        0.35,
    MIN_DENSITY_AMOUNT:    0.10,
    MAX_DENSITY_AMOUNT:    0.45,
    MIN_FORCE:             400,
    MAX_FORCE:             1100,
    VELOCITY_RADIUS:       0.06,
    NIB_SPLIT:             1,
    NIB_SPREAD:            0,
    NIB_JITTER:            0,
    DENSITY_VARIANCE:      0,
    DIRECTION_SMOOTHING:   0.50,
    MIN_DIRECTION_SPEED:   25,
    DENSITY_DISSIPATION:   2.4,
    VELOCITY_DISSIPATION:  2.4,
    CURL_STRENGTH:         5,
    INK_OPACITY:           0.65,
    DENSITY_ALPHA_CURVE:   [0.05, 0.55],
    READABILITY_MASK_STRENGTH: 0.60,
    SUBSTEP_PX:            38,
  },

  sumi: {
    label:                 'SUMI_BLOOM',
    MIN_INK_DISTANCE:      1.5,
    SLOW_SPEED:            150,
    FAST_SPEED:            1800,
    MIN_DYE_LONG_RADIUS:   0.014,
    MAX_DYE_LONG_RADIUS:   0.075,
    MIN_DYE_NARROW_RADIUS: 0.008,
    MAX_DYE_NARROW_RADIUS: 0.018,
    MAX_NIB_ASPECT_RATIO:  5.0,
    BACK_OFFSET_RATIO:     0.40,
    DYE_FRONT_FADE:        0.18,
    MIN_DENSITY_AMOUNT:    0.15,
    MAX_DENSITY_AMOUNT:    0.85,
    MIN_FORCE:             500,
    MAX_FORCE:             1400,
    VELOCITY_RADIUS:       0.085,
    NIB_SPLIT:             1,
    NIB_SPREAD:            0,
    NIB_JITTER:            0,
    DENSITY_VARIANCE:      0,
    DIRECTION_SMOOTHING:   0.45,
    MIN_DIRECTION_SPEED:   25,
    DENSITY_DISSIPATION:   1.4,
    VELOCITY_DISSIPATION:  1.7,
    CURL_STRENGTH:         10,
    INK_OPACITY:           1.0,
    DENSITY_ALPHA_CURVE:   [0.03, 0.40],
    READABILITY_MASK_STRENGTH: 0.55,
    SUBSTEP_PX:            14,
  },

  kitsune: {
    label:                 'KITSUNE_WAKE',
    MIN_INK_DISTANCE:      1.5,
    SLOW_SPEED:            150,
    FAST_SPEED:            1800,
    MIN_DYE_LONG_RADIUS:   0.013,
    MAX_DYE_LONG_RADIUS:   0.060,
    MIN_DYE_NARROW_RADIUS: 0.007,
    MAX_DYE_NARROW_RADIUS: 0.014,
    MAX_NIB_ASPECT_RATIO:  5.5,
    BACK_OFFSET_RATIO:     0.40,
    DYE_FRONT_FADE:        0.15,
    MIN_DENSITY_AMOUNT:    0.10,
    MAX_DENSITY_AMOUNT:    0.65,
    MIN_FORCE:             500,
    MAX_FORCE:             1400,
    VELOCITY_RADIUS:       0.075,
    NIB_SPLIT:             3,       // 1 main + 2 parallel companions
    NIB_SPREAD:            8,       // px (full spread @ FAST_SPEED; collapses at slow)
    NIB_JITTER:            0,
    DENSITY_VARIANCE:      0,
    DIRECTION_SMOOTHING:   0.45,
    MIN_DIRECTION_SPEED:   30,
    DENSITY_DISSIPATION:   1.5,
    VELOCITY_DISSIPATION:  1.5,
    CURL_STRENGTH:         16,
    INK_OPACITY:           0.95,
    DENSITY_ALPHA_CURVE:   [0.025, 0.42],
    READABILITY_MASK_STRENGTH: 0.55,
    SUBSTEP_PX:            12,
  },
};

function resolvePreset() {
  if (typeof window === 'undefined') return PRESETS.sumi;
  const key = new URLSearchParams(window.location.search).get('ink');
  if (key && PRESETS[key]) return PRESETS[key];
  return PRESETS.sumi; // default
}

const MOBILE_BREAKPOINT = 820;
const INK_COLOR = [0.082, 0.067, 0.051]; // matches Tailwind `ink` #15110d (linear-ish)
const IDLE_PAUSE_MS = 5000;

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// --- shaders ---------------------------------------------------

const VS_BASE = /* glsl */ `#version 300 es
  in vec2 aPosition;
  out vec2 vUv;
  out vec2 vL;
  out vec2 vR;
  out vec2 vT;
  out vec2 vB;
  uniform vec2 uTexelSize;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(uTexelSize.x, 0.0);
    vR = vUv + vec2(uTexelSize.x, 0.0);
    vT = vUv + vec2(0.0, uTexelSize.y);
    vB = vUv - vec2(0.0, uTexelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FS_COPY = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vUv;
  uniform sampler2D uTexture;
  out vec4 fragColor;
  void main() { fragColor = texture(uTexture, vUv); }
`;

// Velocity splat — isotropic Gaussian. Velocity injection wants to disturb
// the fluid in a soft localized way; direction info comes from the (uColor.xy)
// momentum vector, not from the splat shape itself.
const FS_SPLAT = /* glsl */ `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect;
  uniform vec3 uColor;
  uniform vec2 uPoint;
  uniform float uRadius;
  out vec4 fragColor;
  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    vec3 base = texture(uTarget, vUv).xyz;
    fragColor = vec4(base + splat, 1.0);
  }
`;

// Directional ink-nib dye splat — anisotropic Gaussian (long along motion,
// narrow across) shifted backwards so the cursor sits at the leading edge,
// with the area in front of the cursor multiplied by uFrontFade so the
// emitter reads like ink trailing off a moving nib instead of a circle.
const FS_DYE_SPLAT = /* glsl */ `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect;
  uniform vec3 uColor;
  uniform vec2 uPoint;
  uniform vec2 uDir;          // unit vector in screen-aspect-corrected space
  uniform float uLongRadius;  // sigma along motion
  uniform float uNarrowRadius;// sigma across motion (nib width)
  uniform float uBackOffset;  // shift gaussian center back along uDir by this much
  uniform float uFrontFade;   // multiplier in front of the cursor (0..1)
  out vec4 fragColor;
  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    float along  = dot(p, uDir);
    float across = p.x * (-uDir.y) + p.y * uDir.x;
    float ashift = along + uBackOffset;
    float falloff = exp(-(ashift * ashift) / (uLongRadius * uLongRadius)
                        -(across * across) / (uNarrowRadius * uNarrowRadius));
    // wider smoothstep range than [0, uLongRadius] avoids a hard edge at the
    // cursor — the front-side fade ramps gradually instead of cutting off.
    float front = smoothstep(0.0, uLongRadius * 2.0, along);
    falloff *= mix(1.0, uFrontFade, front);
    vec3 base = texture(uTarget, vUv).xyz;
    fragColor = vec4(base + uColor * falloff, 1.0);
  }
`;

const FS_ADVECTION = /* glsl */ `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  out vec4 fragColor;
  void main() {
    vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexelSize;
    vec4 result = texture(uSource, coord);
    float decay = 1.0 + uDissipation * uDt;
    fragColor = result / decay;
  }
`;

const FS_DIVERGENCE = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vUv;
  in vec2 vL, vR, vT, vB;
  uniform sampler2D uVelocity;
  out vec4 fragColor;
  void main() {
    float L = texture(uVelocity, vL).x;
    float R = texture(uVelocity, vR).x;
    float T = texture(uVelocity, vT).y;
    float B = texture(uVelocity, vB).y;
    vec2 C = texture(uVelocity, vUv).xy;
    if (vL.x < 0.0) L = -C.x;
    if (vR.x > 1.0) R = -C.x;
    if (vT.y > 1.0) T = -C.y;
    if (vB.y < 0.0) B = -C.y;
    float div = 0.5 * (R - L + T - B);
    fragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const FS_CURL = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vL, vR, vT, vB;
  uniform sampler2D uVelocity;
  out vec4 fragColor;
  void main() {
    float L = texture(uVelocity, vL).y;
    float R = texture(uVelocity, vR).y;
    float T = texture(uVelocity, vT).x;
    float B = texture(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const FS_VORTICITY = /* glsl */ `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec2 vL, vR, vT, vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float uCurlStrength;
  uniform float uDt;
  out vec4 fragColor;
  void main() {
    float L = texture(uCurl, vL).x;
    float R = texture(uCurl, vR).x;
    float T = texture(uCurl, vT).x;
    float B = texture(uCurl, vB).x;
    float C = texture(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;
    vec2 vel = texture(uVelocity, vUv).xy + force * uDt;
    vel = clamp(vel, vec2(-1000.0), vec2(1000.0));
    fragColor = vec4(vel, 0.0, 1.0);
  }
`;

const FS_PRESSURE = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vUv;
  in vec2 vL, vR, vT, vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  out vec4 fragColor;
  void main() {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    float div = texture(uDivergence, vUv).x;
    float p = (L + R + T + B - div) * 0.25;
    fragColor = vec4(p, 0.0, 0.0, 1.0);
  }
`;

const FS_GRADIENT = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vUv;
  in vec2 vL, vR, vT, vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  out vec4 fragColor;
  void main() {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel -= vec2(R - L, T - B);
    fragColor = vec4(vel, 0.0, 1.0);
  }
`;

const FS_DISPLAY = /* glsl */ `#version 300 es
  precision mediump float;
  in vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uInkColor;
  uniform float uOpacityCap;
  uniform float uLowCutoff;
  uniform float uHighCutoff;
  uniform float uReadMin;
  uniform float uReadMax;
  out vec4 fragColor;
  void main() {
    float d = clamp(texture(uTexture, vUv).x, 0.0, 1.0);
    // density-to-alpha curve: clip the gray haze, push the cores to black
    float shaped = smoothstep(uLowCutoff, uHighCutoff, d);
    // ease the left side (where hero text sits) — read goes 0..1 across the viewport
    float mask = mix(uReadMin, uReadMax, smoothstep(0.0, 1.0, vUv.x));
    float a = shaped * uOpacityCap * mask;
    fragColor = vec4(uInkColor * a, a); // premultiplied
  }
`;

// --- WebGL helpers --------------------------------------------

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('shader: ' + err);
  }
  return sh;
}

function program(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'aPosition');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(p);
    throw new Error('link: ' + err);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  // cache uniforms
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { program: p, uniforms: u };
}

function createFBO(gl, w, h, internalFormat, format, type, filter) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture: tex,
    fbo,
    width: w,
    height: h,
    texelX: 1 / w,
    texelY: 1 / h,
    attach(slot) {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      return slot;
    },
  };
}

function createDoubleFBO(gl, w, h, internalFormat, format, type, filter) {
  let a = createFBO(gl, w, h, internalFormat, format, type, filter);
  let b = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    width: w,
    height: h,
    texelX: 1 / w,
    texelY: 1 / h,
    get read() { return a; },
    get write() { return b; },
    swap() { const t = a; a = b; b = t; },
  };
}

// --- component ------------------------------------------------

export default function FluidInkCanvas() {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setFallback(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      setFallback(true);
      return;
    }

    // half-float color-buffer support is required for the sim textures
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
      setFallback(true);
      return;
    }
    gl.getExtension('OES_texture_float_linear');

    // Defer marking webgl-good until the full setup actually succeeds.
    // Anything below can throw (shader compile/link, FBO allocation, etc.) —
    // if it does, fall back to InkCanvas instead of taking the page down.
    const disposers = [];
    const dispose = () => {
      while (disposers.length) {
        try { disposers.pop()(); } catch { /* swallow during teardown */ }
      }
    };

    try {

    const P = resolvePreset();
    console.info(`[FluidInkCanvas] preset: ${P.label} — switch via ?ink=foundation|sumi|kitsune`);

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const dprCap = isMobile ? COMMON.MOBILE_DPR : COMMON.MAX_DPR;
    const scale = isMobile ? COMMON.MOBILE_SCALE : 1;
    const simRes = Math.round(COMMON.SIM_RESOLUTION * scale);
    const dyeRes = Math.round(COMMON.DYE_RESOLUTION * scale);

    // --- programs
    const progCopy       = program(gl, VS_BASE, FS_COPY);
    const progSplat      = program(gl, VS_BASE, FS_SPLAT);
    const progDyeSplat   = program(gl, VS_BASE, FS_DYE_SPLAT);
    const progAdvect     = program(gl, VS_BASE, FS_ADVECTION);
    const progDivergence = program(gl, VS_BASE, FS_DIVERGENCE);
    const progCurl       = program(gl, VS_BASE, FS_CURL);
    const progVorticity  = program(gl, VS_BASE, FS_VORTICITY);
    const progPressure   = program(gl, VS_BASE, FS_PRESSURE);
    const progGradient   = program(gl, VS_BASE, FS_GRADIENT);
    const progDisplay    = program(gl, VS_BASE, FS_DISPLAY);

    // --- fullscreen triangle/quad
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const blit = (target) => {
      if (target == null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.width, target.height);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // --- textures
    // Sim aspect tracks the display canvas so splats stay round in screen space.
    const cssW = () => window.innerWidth;
    const cssH = () => window.innerHeight;
    const aspect = () => cssW() / cssH();

    const getResolution = (target) => {
      const a = aspect();
      if (a < 1) return { w: target, h: Math.round(target / a) };
      return { w: Math.round(target * a), h: target };
    };

    const simSize = getResolution(simRes);
    const dyeSize = getResolution(dyeRes);

    const velocity = createDoubleFBO(gl, simSize.w, simSize.h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    const dye      = createDoubleFBO(gl, dyeSize.w, dyeSize.h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    const divergence = createFBO(gl, simSize.w, simSize.h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);
    const curl       = createFBO(gl, simSize.w, simSize.h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);
    const pressure   = createDoubleFBO(gl, simSize.w, simSize.h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);

    gl.disable(gl.BLEND);

    // --- display canvas sizing
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.floor(cssW() * dpr);
      const h = Math.floor(cssH() * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- input — split queues so velocity and dye can be tuned independently
    const velSplats = []; // {x,y, vx,vy}
    const dyeSplats = []; // {x,y, dirX,dirY, amount}
    let lastInputT = performance.now();
    let prev = null;

    // smoothed direction state — persists across move events so the dye
    // emitter and its perpendicular offsets don't snap sideways on sharp
    // turns. set on first move; reset on mouseleave / idle.
    let smoothedDirX = null;
    let smoothedDirY = null;
    const IDLE_DIR_RESET_MS = 220;   // gap after which we reinit smoothed dir

    const MAX_QUEUED_SPLATS = 1024;

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const lerp = (a, b, t) => a + (b - a) * t;

    const onMove = (e) => {
      const x = e.clientX / cssW();
      const y = 1 - e.clientY / cssH(); // shader space (origin bottom-left)
      const now = performance.now();
      lastInputT = now;
      start();

      if (!prev) { prev = { x, y, t: now }; return; }
      const dx = x - prev.x;
      const dy = y - prev.y;
      const lenPx = Math.hypot(dx * cssW(), dy * cssH());

      // SMALL-MOVE GATE — sub-MIN_INK_DISTANCE moves don't fire anything.
      // Don't advance prev either: small deltas accumulate until they exceed
      // the threshold, then trigger a single proper splat. This is what kills
      // the "tiny move → full-size spike" artifact.
      if (lenPx < P.MIN_INK_DISTANCE) return;

      const lenUnit = Math.hypot(dx, dy);
      if (lenUnit < 1e-5) return;

      // speed → 0..1 mapping via smoothstep
      const dtMs = Math.max(1, now - prev.t);
      const speedPxSec = (lenPx / dtMs) * 1000;
      const range = Math.max(1, P.FAST_SPEED - P.SLOW_SPEED);
      const sRaw = clamp01((speedPxSec - P.SLOW_SPEED) / range);
      const speedT = sRaw * sRaw * (3 - 2 * sRaw); // smoothstep

      // SCALE EMITTER WITH SPEED
      let longR = lerp(P.MIN_DYE_LONG_RADIUS,   P.MAX_DYE_LONG_RADIUS,   speedT);
      const narrow = lerp(P.MIN_DYE_NARROW_RADIUS, P.MAX_DYE_NARROW_RADIUS, speedT);
      const maxLong = narrow * P.MAX_NIB_ASPECT_RATIO;
      if (longR > maxLong) longR = maxLong;        // cap nib aspect — never a spear
      const backOffset = longR * P.BACK_OFFSET_RATIO;
      const dyeAmount = lerp(P.MIN_DENSITY_AMOUNT, P.MAX_DENSITY_AMOUNT, speedT);
      const force = lerp(P.MIN_FORCE, P.MAX_FORCE, speedT);

      // raw direction in shader-aspect-corrected space (dye shader does p.x *= uAspect)
      const ar = aspect();
      const aLen = Math.hypot(dx * ar, dy);
      const rawDirX = (dx * ar) / aLen;
      const rawDirY = dy / aLen;

      // LIGHT direction smoothing — single normalized lerp, no clamping, no slerp.
      // The previous slerp/turn-factor pipeline caused skipping because it could
      // zero out amount and force on sharp turns. Speed scaling alone handles
      // the spike-from-tiny-move case; direction smoothing just removes the
      // last bit of nervous wobble.
      if (
        smoothedDirX === null ||
        smoothedDirY === null ||
        (now - prev.t) > IDLE_DIR_RESET_MS
      ) {
        smoothedDirX = rawDirX;
        smoothedDirY = rawDirY;
      } else if (speedPxSec >= P.MIN_DIRECTION_SPEED) {
        const k = P.DIRECTION_SMOOTHING;
        const nx_ = smoothedDirX * (1 - k) + rawDirX * k;
        const ny_ = smoothedDirY * (1 - k) + rawDirY * k;
        const n = Math.hypot(nx_, ny_) || 1;
        smoothedDirX = nx_ / n;
        smoothedDirY = ny_ / n;
      }
      const dirX = smoothedDirX;
      const dirY = smoothedDirY;

      // perpendicular to smoothed direction in unit-square space (for companions)
      const sxU = dirX / ar;
      const syU = dirY;
      const sL = Math.hypot(sxU, syU) || 1;
      const nx = -syU / sL;
      const ny = sxU / sL;

      const stepCount = Math.max(1, Math.ceil(lenPx / P.SUBSTEP_PX));
      // companions also scale with speed — collapse to center on tiny moves
      const spreadUnitX = (P.NIB_SPREAD * speedT) / cssW();
      const spreadUnitY = (P.NIB_SPREAD * speedT) / cssH();
      const jitterUnitX = (P.NIB_JITTER * speedT) / cssW();
      const jitterUnitY = (P.NIB_JITTER * speedT) / cssH();
      const nibs = Math.max(1, P.NIB_SPLIT);

      for (let s = 1; s <= stepCount; s++) {
        const t = s / stepCount;
        const px = prev.x + dx * t;
        const py = prev.y + dy * t;
        const sdx = dx / stepCount;
        const sdy = dy / stepCount;

        if (velSplats.length < MAX_QUEUED_SPLATS) {
          velSplats.push({
            x: px, y: py,
            vx: sdx * force,
            vy: sdy * force,
          });
        }

        for (let i = 0; i < nibs; i++) {
          const u = nibs === 1 ? 0 : (i / (nibs - 1) - 0.5) * 2;
          const jSign = P.NIB_JITTER > 0 ? Math.random() * 2 - 1 : 0;
          const ox = nx * (spreadUnitX * u + jitterUnitX * jSign);
          const oy = ny * (spreadUnitY * u + jitterUnitY * jSign);
          const lateral = 1 - Math.abs(u) * 0.5;
          const variance = P.DENSITY_VARIANCE > 0
            ? 1 + (Math.random() * 2 - 1) * P.DENSITY_VARIANCE
            : 1;
          const amount = dyeAmount * lateral * variance;
          if (amount <= 0) continue;
          if (dyeSplats.length >= MAX_QUEUED_SPLATS) break;
          dyeSplats.push({
            x: px + ox, y: py + oy,
            dirX, dirY,
            amount,
            longR, narrow, backOffset, // per-splat shape — varies with move speed
          });
        }
      }

      prev = { x, y, t: now };
    };

    const onTouch = (e) => {
      if (!e.touches.length) return;
      onMove(e.touches[0]);
    };
    const onLeave = () => {
      prev = null;
      smoothedDirX = null;
      smoothedDirY = null;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    // --- visibility pause
    let visible = !document.hidden;
    const onVis = () => {
      visible = !document.hidden;
      if (visible) { lastInputT = performance.now(); start(); }
    };
    document.addEventListener('visibilitychange', onVis);

    // --- splat application — velocity and dye use different shaders now
    const applySplats = () => {
      const ar = aspect();

      // Velocity splats (isotropic Gaussian)
      if (velSplats.length > 0) {
        gl.useProgram(progSplat.program);
        gl.uniform1f(progSplat.uniforms.uAspect, ar);
        gl.uniform1f(progSplat.uniforms.uRadius, P.VELOCITY_RADIUS / 100);
        for (const s of velSplats) {
          gl.uniform1i(progSplat.uniforms.uTarget, velocity.read.attach(0));
          gl.uniform2f(progSplat.uniforms.uPoint, s.x, s.y);
          gl.uniform3f(progSplat.uniforms.uColor, s.vx, s.vy, 0);
          blit(velocity.write);
          velocity.swap();
        }
        velSplats.length = 0;
      }

      // Dye splats (directional nib). uLongRadius/uNarrowRadius/uBackOffset
      // vary per splat (speed-scaled), so set them inside the loop. uAspect
      // and uFrontFade are constant for the batch.
      if (dyeSplats.length > 0) {
        gl.useProgram(progDyeSplat.program);
        gl.uniform1f(progDyeSplat.uniforms.uAspect, ar);
        gl.uniform1f(progDyeSplat.uniforms.uFrontFade, P.DYE_FRONT_FADE);
        for (const s of dyeSplats) {
          gl.uniform1i(progDyeSplat.uniforms.uTarget, dye.read.attach(0));
          gl.uniform2f(progDyeSplat.uniforms.uPoint, s.x, s.y);
          gl.uniform2f(progDyeSplat.uniforms.uDir, s.dirX, s.dirY);
          gl.uniform1f(progDyeSplat.uniforms.uLongRadius, s.longR);
          gl.uniform1f(progDyeSplat.uniforms.uNarrowRadius, s.narrow);
          gl.uniform1f(progDyeSplat.uniforms.uBackOffset, s.backOffset);
          gl.uniform3f(progDyeSplat.uniforms.uColor, s.amount, 0, 0);
          blit(dye.write);
          dye.swap();
        }
        dyeSplats.length = 0;
      }
    };

    // --- step
    const step = (dt) => {
      gl.bindVertexArray(vao);
      gl.disable(gl.BLEND);

      applySplats();

      // curl
      gl.useProgram(progCurl.program);
      gl.uniform2f(progCurl.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progCurl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      // vorticity confinement → velocity
      gl.useProgram(progVorticity.program);
      gl.uniform2f(progVorticity.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progVorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progVorticity.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(progVorticity.uniforms.uCurlStrength, P.CURL_STRENGTH);
      gl.uniform1f(progVorticity.uniforms.uDt, dt);
      blit(velocity.write);
      velocity.swap();

      // divergence
      gl.useProgram(progDivergence.program);
      gl.uniform2f(progDivergence.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progDivergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      // clear pressure (decay)
      gl.useProgram(progCopy.program);
      gl.uniform1i(progCopy.uniforms.uTexture, pressure.read.attach(0));
      blit(pressure.write);
      pressure.swap();

      // pressure Jacobi
      gl.useProgram(progPressure.program);
      gl.uniform2f(progPressure.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progPressure.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < COMMON.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(progPressure.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      // subtract gradient
      gl.useProgram(progGradient.program);
      gl.uniform2f(progGradient.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progGradient.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(progGradient.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // advect velocity
      gl.useProgram(progAdvect.program);
      gl.uniform2f(progAdvect.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progAdvect.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progAdvect.uniforms.uSource, velocity.read.attach(0));
      gl.uniform1f(progAdvect.uniforms.uDt, dt);
      gl.uniform1f(progAdvect.uniforms.uDissipation, P.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      // advect dye
      gl.uniform2f(progAdvect.uniforms.uTexelSize, velocity.texelX, velocity.texelY);
      gl.uniform1i(progAdvect.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(progAdvect.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(progAdvect.uniforms.uDt, dt);
      gl.uniform1f(progAdvect.uniforms.uDissipation, P.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    };

    // --- render
    const render = () => {
      gl.useProgram(progDisplay.program);
      gl.uniform1i(progDisplay.uniforms.uTexture, dye.read.attach(0));
      gl.uniform3f(progDisplay.uniforms.uInkColor, INK_COLOR[0], INK_COLOR[1], INK_COLOR[2]);
      gl.uniform1f(progDisplay.uniforms.uOpacityCap, P.INK_OPACITY);
      gl.uniform1f(progDisplay.uniforms.uLowCutoff, P.DENSITY_ALPHA_CURVE[0]);
      gl.uniform1f(progDisplay.uniforms.uHighCutoff, P.DENSITY_ALPHA_CURVE[1]);
      // READABILITY_MASK_STRENGTH 0..1 → readMin = (1-strength), readMax = 1.
      // strength=0 disables the mask (uniform), strength=1 puts the left side
      // fully transparent. The hero text sits on the left.
      gl.uniform1f(progDisplay.uniforms.uReadMin, 1 - P.READABILITY_MASK_STRENGTH);
      gl.uniform1f(progDisplay.uniforms.uReadMax, 1.0);
      blit(null);
    };

    // --- main loop
    let rafId = 0;
    let running = false;
    let lastT = performance.now();

    const loop = (now) => {
      if (!visible) { running = false; return; }
      resizeCanvas();
      const dt = Math.min(0.0166, Math.max(0.0001, (now - lastT) / 1000));
      lastT = now;

      step(dt);
      render();

      // pause once everything is idle: no recent input, no live splats,
      // and dye is effectively black (skip the dye-empty check — costly to sample;
      // just rely on time since last input plus dissipation handling the fade)
      if (now - lastInputT > IDLE_PAUSE_MS) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || !visible) return;
      running = true;
      lastT = performance.now();
      rafId = requestAnimationFrame(loop);
    };

    disposers.push(() => cancelAnimationFrame(rafId));
    disposers.push(() => window.removeEventListener('resize', resizeCanvas));
    disposers.push(() => window.removeEventListener('mousemove', onMove));
    disposers.push(() => window.removeEventListener('touchmove', onTouch));
    disposers.push(() => window.removeEventListener('mouseleave', onLeave));
    disposers.push(() => document.removeEventListener('visibilitychange', onVis));
    disposers.push(() => {
      [velocity.read, velocity.write, dye.read, dye.write, divergence, curl, pressure.read, pressure.write].forEach((f) => {
        gl.deleteTexture(f.texture);
        gl.deleteFramebuffer(f.fbo);
      });
      [progCopy, progSplat, progDyeSplat, progAdvect, progDivergence, progCurl, progVorticity, progPressure, progGradient, progDisplay].forEach((p) => gl.deleteProgram(p.program));
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    });

    setFallback(false);
    start();

    } catch (e) {
      console.warn('[FluidInkCanvas] init failed, falling back to InkCanvas:', e);
      dispose();
      setFallback(true);
      return undefined;
    }

    return dispose;
  }, []);

  if (fallback === true) return <InkCanvas />;

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
