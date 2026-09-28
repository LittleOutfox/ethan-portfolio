attribute float aPath;
attribute float aSnow;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vMask; // x: on the path, y: snowfield

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vMask = vec2(aPath, aSnow);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
