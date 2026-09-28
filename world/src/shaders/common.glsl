// Shared by every surface: the site's palette, fog, and the final pass
// (the vignette that melts the world into ink, then a dither).
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uInk;
uniform vec3 uSpirit;
uniform vec3 uMoonColor;
uniform vec3 uEmber;
uniform vec3 uBloom;
uniform vec3 uGlow;
uniform vec3 uMoonDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uMoon;
uniform float uCanopy;
uniform float uSnow;
uniform float uWarm;
uniform float uHaze;
uniform vec3 uHearth;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// smooth value noise, for patches that shouldn't look like tiles
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

// The fog's own colour: violet, warmed to rose all along the horizon, and
// brighter toward the moon where moonlight scatters in the mist — the glow
// at the end of the path.
vec3 fogTint(vec3 dir) {
  float s = max(dot(dir, uMoonDir), 0.0);
  float rose = exp(-abs(dir.y) * 7.0);
  vec3 lit = mix(uBloom, uSpirit, 0.45);
  return uFogColor + uBloom * uHaze * 0.18 * rose
       + lit * uHaze * 0.65 * (0.35 * pow(s, 6.0) + 0.65 * pow(s, 48.0));
}

// distance fog that lies thicker near the ground
vec3 fog(vec3 col, vec3 wpos) {
  vec3 ray = wpos - cameraPosition;
  float d = length(ray);
  float low = exp(-max(wpos.y - (cameraPosition.y - 1.5), 0.0) * 0.14);
  float f = 1.0 - exp(-d * uFogDensity * (0.6 + 0.6 * low));
  return mix(col, fogTint(ray / d), clamp(f, 0.0, 1.0));
}

// the den's hearth: warm light on whatever stands near it, strongest on the side that faces it
vec3 hearth(vec3 col, vec3 wpos, vec3 n) {
  vec3 L = uHearth - wpos;
  float d = length(L);
  float k = exp(-d * 0.16) * uWarm;
  return col + uEmber * k * 0.05 * (0.25 + 0.75 * max(dot(n, L / d), 0.0));
}

// The page's old CSS veil, now drawn in the same pass: an ellipse centred
// at 42% from the top, plus darker bands at the top and bottom edges.
vec3 finish(vec3 col) {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float fromTop = 1.0 - uv.y;
  float band = max(0.65 * clamp(1.0 - fromTop / 0.26, 0.0, 1.0),
                   0.82 * clamp((fromTop - 0.68) / 0.32, 0.0, 1.0));
  col = mix(col, uInk, band);
  vec2 q = vec2((uv.x - 0.5) / 1.15, (fromTop - 0.42) / 0.95);
  float vig = 0.92 * clamp((length(q) - 0.24) / 0.76, 0.0, 1.0);
  return mix(col, uInk, vig);
}

// breaks up 8-bit banding in the dark gradients (applied after sRGB encode)
vec3 dither() {
  return vec3((hash12(gl_FragCoord.xy) - 0.5) / 255.0);
}
