// The air around the camera: a box of motes that wraps as the camera moves.
// In the forest they drift, faint; as the snow grade rises they become
// falling snow. The pointer stirs them (pushed aside in screen space).
uniform float uTime;
uniform float uScale;
uniform float uSnow;
uniform vec3 uPointer; // ndc x, y, strength
uniform vec2 uResolution;

attribute vec4 aSeed; // phase, size, fall speed, brightness

varying float vAlpha;

const vec3 BOX = vec3(44.0, 26.0, 44.0);

void main() {
  float ph = aSeed.x * 6.2831;
  float fall = mix(0.05, 0.7 + aSeed.z * 0.9, uSnow);
  vec3 drift = vec3(sin(uTime * 0.21 + ph) * 0.6 + uTime * 0.12, -uTime * fall, cos(uTime * 0.17 + ph) * 0.6);
  vec3 p = mod(position + drift - cameraPosition + BOX * 0.5, BOX) - BOX * 0.5 + cameraPosition;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  // a passing hand (or finger) pushes the air aside
  vec2 ndc = clip.xy / clip.w;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 away = (ndc - uPointer.xy) * aspect;
  float d = length(away);
  float push = uPointer.z * smoothstep(0.22, 0.0, d) * 0.08;
  clip.xy += (away / max(d, 1e-4)) / aspect * push * clip.w;
  gl_Position = clip;

  float depth = -mv.z;
  float size = mix(0.035, 0.07, uSnow) * (0.6 + aSeed.y);
  gl_PointSize = clamp(size * uScale / depth, 1.0, 12.0);
  // fade in from the near plane and out into the fog
  float fade = smoothstep(0.6, 2.5, depth) * (1.0 - smoothstep(14.0, 22.0, depth));
  vAlpha = aSeed.w * fade * mix(0.18, 0.75, uSnow);
}
