// Motes of light drifting round a spirit bloom's orb, each on its own tilted
// orbit, rising and falling, twinkling. Drawn with the foxfire's sprite.
uniform float uTime;
uniform float uScale;

attribute vec4 aMote; // phase, orbit radius (m), speed, height off the orb (m)

varying vec4 vColor;
varying float vOrb;

void main() {
  float ph = aMote.x * 6.2831;
  float a = uTime * aMote.z + ph;
  vec3 p = position + vec3(cos(a) * aMote.y, aMote.w + sin(a * 0.7 + ph) * 0.12, sin(a) * aMote.y * 0.8);
  float twinkle = 0.5 + 0.5 * sin(uTime * (1.5 + aMote.z * 3.0) + ph * 3.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float near = 1.0 - smoothstep(20.0, 36.0, -mv.z);
  vColor = vec4(mix(vec3(0.36, 0.91, 1.0), vec3(0.8, 0.97, 1.0), twinkle), (0.35 + 0.65 * twinkle) * near);
  vOrb = 0.0;
  gl_PointSize = clamp(0.05 * uScale / -mv.z, 1.0, 24.0);
}
