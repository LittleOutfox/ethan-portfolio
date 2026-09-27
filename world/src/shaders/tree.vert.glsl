attribute float aUp; // height up the tree, 0..1

varying vec4 vWorldUp; // world position, height
varying vec3 vNormal;
varying float vRand;   // per-tree variation

void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = m * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vWorldUp = vec4(wp.xyz, aUp);
  vNormal = normalize(mat3(m) * normal);
  vRand = fract(sin(dot(m[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
