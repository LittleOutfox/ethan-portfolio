// A unit sphere that always surrounds the camera: rotation-only view, pushed
// to the far plane so every surface in front of it wins the depth test.
varying vec3 vDir;

void main() {
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = p.xyww;
}
