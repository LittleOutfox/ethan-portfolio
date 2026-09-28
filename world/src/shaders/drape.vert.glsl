// Willow curtains: each card hangs from a branch (uv.y = 1) to its hem
// (uv.y = 0) and sways from the top, most at the hem.
uniform float uTime;
attribute float aSeed; // per card

varying vec2 vUv;
varying vec4 vWorldSeed; // world position, seed

void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = m * instanceMatrix;
  #endif
  vec3 p = position;
  float hang = 1.0 - uv.y;
  float ph = aSeed * 6.2831 + m[3].x * 0.21 + m[3].z * 0.17;
  float sway = sin(uTime * 0.5 + ph) * 0.7 + sin(uTime * 1.23 + ph * 1.7) * 0.3;
  p.x += sway * 0.3 * hang * hang;
  p.z += cos(uTime * 0.43 + ph) * 0.22 * hang * hang;
  vec4 wp = m * vec4(p, 1.0);
  vUv = uv;
  vWorldSeed = vec4(wp.xyz, aSeed);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
