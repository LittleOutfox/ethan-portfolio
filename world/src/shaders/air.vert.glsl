// The air around the camera: a box of particles that wraps as the camera
// moves. Snow falls slowly everywhere — lightly in the forest, more of it
// out on the snowfield — with a few blue spirit motes drifting up through
// it. Each particle is always one or the other (only how many show changes
// with the snow grade, so nothing jumps as it changes). The pointer stirs
// them.
uniform float uTime;
uniform float uScale;
uniform float uSnow;
uniform vec3 uPointer; // ndc x, y, strength
uniform vec2 uResolution;

attribute vec4 aSeed; // phase, size, speed, brightness

varying vec4 vLook; // alpha, 1 for a flake (0 a mote), hue

const vec3 BOX = vec3(44.0, 26.0, 44.0);

void main() {
  float ph = aSeed.x * 6.2831;
  float pick = fract(aSeed.x * 17.31 + aSeed.z * 3.7);
  float flake = step(pick, 0.5);
  // how many of each kind show: a share of its half, faded in by rank
  float rank = pick - 0.5 * (1.0 - flake);
  float share = flake > 0.5 ? mix(0.05, 0.22, uSnow) : mix(0.08, 0.02, uSnow);
  float show = smoothstep(rank, rank + 0.015, share);
  if (show <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off screen: nothing to draw
    gl_PointSize = 0.0;
    vLook = vec4(0.0);
    return;
  }

  // flakes fall slowly and sway; motes rise, barely, and meander
  float fall = flake * (0.22 + aSeed.z * 0.26) - (1.0 - flake) * (0.03 + aSeed.z * 0.05);
  float sway = mix(0.5, 0.8, flake);
  vec3 drift = vec3(sin(uTime * 0.23 + ph) * sway + uTime * 0.04, -uTime * fall, cos(uTime * 0.19 + ph) * sway);
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
  float size = mix(0.035, 0.075, flake) * (0.6 + aSeed.y);
  gl_PointSize = clamp(size * uScale / depth, 1.0, 12.0);
  // fade in from the near plane and out into the fog; motes twinkle
  float fade = smoothstep(0.6, 2.5, depth) * (1.0 - smoothstep(14.0, 22.0, depth));
  float twinkle = mix(0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.9 + aSeed.z * 2.0) + ph * 3.0)), 1.0, flake);
  vLook = vec4(aSeed.w * fade * show * twinkle * mix(0.8, 0.4, flake), flake, fract(aSeed.x * 5.77), 0.0);
}
