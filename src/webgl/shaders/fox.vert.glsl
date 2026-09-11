// Fox field vertex shader. Screen-space: every position is computed in CSS pixels and mapped
// straight to clip space, so DOM cells (plate rects) anchor the poses exactly.

attribute vec2 aFoxA;      // pose A in mask space 0..1 (y down), normalized uint16
attribute vec2 aFoxB;      // pose B in mask space 0..1
attribute vec4 aSeed;      // x phase, y size multiplier, z drift amplitude, w class (0 snow, 0.5 trace, 1 volume)
attribute vec2 aGeo;       // geodesic distance from the nose, pose A and pose B, 0..1

uniform vec2 uViewport;    // CSS px
uniform float uScrollY;    // raw page scroll, CSS px
uniform vec4 uPlateA;      // pose A rect in PAGE px: x, y, w, h
uniform vec4 uPlateB;      // pose B rect in PAGE px
uniform float uFormA;      // sweeps -0.3 .. 1.3: how much of pose A is formed (nose first)
uniform float uFormB;      // same for pose B
uniform float uTime;       // seconds, pre-wrapped
uniform float uDpr;
uniform float uPointSize;  // CSS px at sizeMul 1
uniform float uMaxPointSize;
uniform float uLightX;     // 0..1, where the moon is across the viewport
uniform vec4 uPulse;       // x, y in page px; z = start time; w = amplitude
uniform vec3 uColorBody;
uniform vec3 uColorTip;
uniform vec3 uColorSnow;
uniform vec3 uColorCore;
uniform float uIdlePulse;  // 0 or 1
uniform float uDrift;      // 0..1 global drift amplitude (0 under reduced motion)
uniform float uFade;       // 0..1 global opacity
uniform vec2 uAssert;      // y in page px, amplitude: brighten the trace beside a hovered row

varying vec4 vColorAlpha;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  // per-point formation thresholds: tail tips (geo 1) release first, nose (geo 0) last
  float tA = aGeo.x;
  float tB = aGeo.y;
  float wA = smoothstep(tA - 0.18, tA + 0.18, uFormA);
  float wB = smoothstep(tB - 0.18, tB + 0.18, uFormB) * (1.0 - wA);
  float wS = 1.0 - wA - wB;

  vec2 posA = uPlateA.xy + aFoxA * uPlateA.zw;
  vec2 posB = uPlateB.xy + aFoxB * uPlateB.zw;

  // scatter: snow (class 0) is viewport-anchored and falls; everything else is page-anchored
  float isSnow = 1.0 - step(0.25, aSeed.w);
  float fall = mod(position.y + uTime * (14.0 + 26.0 * aSeed.y) + aSeed.x * 4000.0, uViewport.y + 40.0) - 20.0;
  vec2 scatter = mix(position.xy, vec2(position.x, fall), isSnow);
  // slow drift, only while released; trace points hold their line (a signal stays on its net)
  float isTrace = step(0.25, aSeed.w) * (1.0 - step(0.75, aSeed.w));
  float ph = aSeed.x * 6.2831853;
  vec2 drift = vec2(sin(uTime * 0.31 + ph) + 0.5 * sin(uTime * 0.83 + ph * 2.0),
                    cos(uTime * 0.27 + ph * 1.3)) * (10.0 + 24.0 * aSeed.z) * uDrift * (1.0 - 0.92 * isTrace);
  scatter += drift * wS;

  // the path between formed and released is an arc, not a straight line: each point bows
  // sideways by its own amount and settles back, so a release reads as a drift, not a fountain
  float travel = sin(clamp(wS, 0.0, 1.0) * 3.14159265);
  vec2 arc = vec2(cos(ph), sin(ph * 1.7)) * (40.0 + 90.0 * aSeed.z) * travel * uDrift;
  vec2 pPage = scatter * wS + posA * wA + posB * wB + arc;
  // snow stays in viewport space; formed/page points subtract scroll
  float pageAnchored = (1.0 - isSnow) + isSnow * (wA + wB);
  vec2 p = pPage - vec2(0.0, uScrollY) * pageAnchored;

  // clip space, y down in CSS px
  gl_Position = vec4(p.x / uViewport.x * 2.0 - 1.0, 1.0 - p.y / uViewport.y * 2.0, 0.0, 1.0);

  // luminance: base, idle nose-to-tail pulse, pointer pulse, moonlit side
  float formed = wA + wB;
  float geo = aGeo.x * wA + aGeo.y * wB;
  float pulsePos = fract(uTime / 6.0) * 1.4 - 0.2;
  float idle = exp(-pow((geo - pulsePos) / 0.05, 2.0)) * uIdlePulse * formed;
  float age = uTime - uPulse.z;
  float radius = age * 900.0;
  float ring = exp(-pow((distance(pPage, uPulse.xy) - radius) / 60.0, 2.0)) * exp(-age * 1.4) * step(0.0, age) * uPulse.w * formed;
  float lit = 1.0 + 0.12 * (1.0 - abs(p.x / uViewport.x - uLightX) * 1.6);
  float depth = 0.65 + 0.35 * aSeed.z;
  // released trace points carry slow luminance packets and answer to a hovered row
  float tp = hash11(floor((position.y + 2.5) / 5.0) * 0.37 + 1.0);
  float px = mod(uTime * (90.0 + 70.0 * tp) + tp * 5000.0, uViewport.x + 800.0) - 400.0;
  float packet = exp(-pow((pPage.x - px) / 110.0, 2.0)) * isTrace * wS;
  float assertLum = exp(-pow((pPage.y - uAssert.x) / 26.0, 2.0)) * uAssert.y * isTrace * wS;
  float lum = (0.8 * depth + 0.5 * idle + 0.9 * ring + 0.7 * packet + 0.9 * assertLum) * lit;

  // colour: cold body, violet only at the tail tips, snow colour when released
  vec3 formedColor = mix(uColorBody, uColorTip, smoothstep(0.82, 1.0, geo));
  vec3 color = mix(mix(uColorSnow, uColorBody, 0.75 * isTrace), formedColor, formed);
  color = mix(color, uColorCore, clamp(idle + ring, 0.0, 1.0) * 0.8);

  // bloom seeds: a few larger, fainter points supply the low-frequency glow
  float big = step(0.90, aSeed.y);
  float sizeMul = mix(0.7 + 0.6 * (aSeed.y / 0.9), 3.0, big);
  float alpha = mix(0.3, 0.08, big) * (0.7 + 0.3 * depth);
  // released points are quieter: dust faintest, snow soft, traces the brightest of the three
  alpha *= mix(0.1 + 0.42 * isTrace + 0.16 * isSnow, 1.0, formed);

  vColorAlpha = vec4(color * lum, alpha * uFade);
  gl_PointSize = clamp(uPointSize * sizeMul * uDpr, 1.0, uMaxPointSize);
}
