// Spirit lights. Orbs drift and bob on their own clocks; den embers rise and
// fade on a loop; the five tail bands only light once their tail is earned;
// the shrine's lanterns burn where they stand.
uniform float uTime;
uniform float uScale;
uniform float uTails;
uniform float uWake;
uniform float uWarm;
uniform vec2 uResolution;

attribute vec4 aSeed;  // phase, sprite size (m), speed, brightness
attribute float aKind; // 0 orb, 1 ember, 2 hearth glow, 2+b tail band b (1..5), 9 lantern

varying vec4 vColor;
varying float vOrb;

void main() {
  vec3 p = position;
  float ph = aSeed.x * 6.2831;
  float t = uTime * aSeed.z;
  float light = aSeed.w;
  float orb = 1.0 - step(0.5, aKind);
  float ember = step(0.5, aKind) * (1.0 - step(1.5, aKind));
  float glow = step(1.5, aKind) * (1.0 - step(2.5, aKind));
  float lantern = step(8.5, aKind);
  float band = step(2.5, aKind) * (1.0 - lantern);

  // orbs and band lights hover; embers climb and are reborn at the fire
  p += (1.0 - ember - lantern) * vec3(sin(t * 0.7 + ph) * 0.5, sin(t * 1.1 + ph * 1.3) * 0.35, cos(t * 0.6 + ph) * 0.5);
  float rise = fract(uTime * (0.18 + 0.2 * aSeed.z) + aSeed.x);
  p += ember * vec3(sin(rise * 9.0 + ph) * 0.3, rise * 3.2, cos(rise * 7.0 + ph) * 0.3);

  // flicker, and when each kind may shine
  float flick = 0.75 + 0.25 * sin(uTime * (1.3 + aSeed.z * 2.0) + ph) * sin(uTime * 1.1 + ph * 2.1);
  float on = orb * uWake
           + ember * uWarm * (1.0 - rise) * smoothstep(0.0, 0.15, rise)
           + glow * uWarm
           + band * smoothstep(aKind - 3.0, aKind - 2.0, uTails)
           + lantern;
  // orbs are spirit blue to pale; the fire is amber; the tail bands a pale
  // blue; the lanterns a warm red, the one warm light out in the snow
  vec3 blue = mix(vec3(0.3, 0.62, 1.0), vec3(0.58, 0.8, 1.0), fract(aSeed.x * 7.3));
  vec3 col = mix(blue, vec3(1.0, 0.62, 0.3), max(ember, glow));
  col = mix(col, vec3(0.7, 0.86, 1.0), band);
  col = mix(col, vec3(1.0, 0.36, 0.22), lantern);
  vColor = vec4(col, light * flick * on);
  vOrb = orb;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // a light drifting right up to the lens fades rather than blooming into a
  // blur; orbs keep their distance, so they stay small spirit lights and never
  // swell behind the page's text
  vColor.a *= smoothstep(mix(2.0, 4.0, orb), mix(5.0, 10.0, orb), -mv.z) * (1.0 - glow) + glow;
  // orbs never grow past a small share of the screen: little lights, not blurs over the text
  gl_PointSize = clamp(aSeed.y * uScale / -mv.z, 1.0, mix(200.0, uResolution.y * 0.05, orb));
}
