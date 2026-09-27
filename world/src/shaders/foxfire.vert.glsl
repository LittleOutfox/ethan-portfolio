// Kitsunebi: soft spirit lights. Each point bobs and drifts on its own
// clock; den embers rise and fade on a loop; the five tail bands only light
// once their tail is earned.
uniform float uTime;
uniform float uScale;
uniform float uTails;
uniform float uWake;
uniform float uWarm;

attribute vec4 aSeed;  // phase, size (m), speed, brightness
attribute float aKind; // 0 wisp, 1 ember, 2 hearth glow, 3+b tail band b (1..5)

varying vec4 vColor;

void main() {
  vec3 p = position;
  float ph = aSeed.x * 6.2831;
  float t = uTime * aSeed.z;
  float light = aSeed.w;
  float ember = step(0.5, aKind) * (1.0 - step(1.5, aKind));
  float glow = step(1.5, aKind) * (1.0 - step(2.5, aKind));
  float band = step(2.5, aKind);

  // wisps and band lights hover; embers climb and are reborn at the fire
  p += (1.0 - ember) * vec3(sin(t * 0.7 + ph) * 0.5, sin(t * 1.1 + ph * 1.3) * 0.35, cos(t * 0.6 + ph) * 0.5);
  float rise = fract(uTime * (0.18 + 0.2 * aSeed.z) + aSeed.x);
  p += ember * vec3(sin(rise * 9.0 + ph) * 0.3, rise * 3.2, cos(rise * 7.0 + ph) * 0.3);

  // flicker, and when each kind may shine
  float flick = 0.7 + 0.3 * sin(uTime * (2.3 + aSeed.z * 3.0) + ph) * sin(uTime * 1.7 + ph * 2.1);
  float on = (1.0 - ember - glow - band) * uWake
           + ember * uWarm * (1.0 - rise) * smoothstep(0.0, 0.15, rise)
           + glow * uWarm
           + band * smoothstep(aKind - 3.0, aKind - 2.0, uTails);
  vColor = vec4(mix(mix(vec3(0.62, 0.7, 1.0), vec3(0.55, 0.9, 0.95), aSeed.y * 1.5), vec3(1.0, 0.62, 0.3), max(ember, glow)),
                light * flick * on);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // a light drifting right up to the lens fades rather than blooming into a blur
  vColor.a *= smoothstep(2.0, 5.0, -mv.z) * (1.0 - glow) + glow;
  gl_PointSize = clamp(aSeed.y * uScale / -mv.z, 1.0, 64.0);
}
