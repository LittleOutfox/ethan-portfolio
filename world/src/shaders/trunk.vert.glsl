varying vec3 vWorld;
varying vec3 vNormal;
varying float vUp; // 0 at the roots, 1 at the crown

void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = m * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(m) * normal);
  vUp = position.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
