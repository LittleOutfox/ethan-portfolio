// A spirit bloom's roots, stalk, tendrils and leaves. The orb rides on the
// same instance transform, so each part knows where its own light is.
#ifndef LEAF
attribute float aUp; // height up the bloom, 0..1
#endif

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;  // leaves: across (−1..1), along (0..1); bark: (0, height)
varying vec4 vOrb; // the orb's centre, and the bloom's scale

void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = m * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(m) * normal);
  #ifdef LEAF
    vUv = uv;
  #else
    vUv = vec2(0.0, aUp);
  #endif
  vOrb = vec4((m * vec4(0.0, ORB_Y, 0.0, 1.0)).xyz, length(m[0].xyz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
