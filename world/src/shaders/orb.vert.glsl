// A spirit bloom's orb, and the shell its glow is drawn on.
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vCentre; // the orb's centre, and its radius (m)

void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = m * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(m) * normal);
  vCentre = vec4((m * vec4(0.0, ORB_Y, 0.0, 1.0)).xyz, ORB_R * length(m[0].xyz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
