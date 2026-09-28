// Glowing flowers in the snow: each breathes on its own slow clock and turns
// a little; only the near ones show (far away they would gather along the
// horizon, where the page's text reads).
uniform float uTime;
uniform float uScale;
uniform vec2 uResolution;

attribute vec2 aLook; // size (m), phase

varying float vStrength;
varying float vSpin;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = clamp(aLook.x * uScale / depth, 1.0, uResolution.y * 0.09);
  float breathe = 0.75 + 0.25 * sin(uTime * (0.5 + aLook.y * 0.4) + aLook.y * 6.2831);
  vStrength = breathe * smoothstep(1.5, 4.0, depth) * (1.0 - smoothstep(11.0, 19.0, depth));
  vSpin = aLook.y * 6.2831 + uTime * 0.04;
}
