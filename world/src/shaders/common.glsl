// Shared by every surface: the site's palette, fog, and the final pass
// (the vignette that melts the world into ink, then a dither).
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uInk;
uniform vec3 uSpirit;
uniform vec3 uMoonColor;
uniform vec3 uEmber;
uniform vec3 uMoonDir;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uMoon;
uniform float uCanopy;
uniform float uSnow;
uniform float uWarm;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// distance fog that lies thicker near the ground
vec3 fog(vec3 col, vec3 wpos) {
  float d = distance(wpos, cameraPosition);
  float low = exp(-max(wpos.y - (cameraPosition.y - 1.5), 0.0) * 0.14);
  float f = 1.0 - exp(-d * uFogDensity * (0.6 + 0.6 * low));
  return mix(col, uFogColor, clamp(f, 0.0, 1.0));
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
