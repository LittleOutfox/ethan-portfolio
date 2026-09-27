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
  // the canopy stirs, slowly
  float ph = aSeed * 6.2831 + m[3].x * 0.3;
  p += vec3(sin(uTime * 0.7 + ph), 0.0, cos(uTime * 0.6 + ph)) * 0.06;
  vec4 wp = m * vec4(p, 1.0);
  vUv = uv;
  vWorldSeed = vec4(wp.xyz, aSeed);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
