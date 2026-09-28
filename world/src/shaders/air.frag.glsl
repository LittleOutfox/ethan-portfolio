uniform vec3 uMoonColor;
uniform vec3 uSpirit;
uniform vec3 uFrost;
uniform vec3 uGlow;

varying vec4 vLook; // alpha, 1 for a flake (0 a mote), hue

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  // flakes are soft discs; motes a bright point in a little glow
  float disc = smoothstep(1.0, 0.15, r2);
  float mote = exp(-r2 * 10.0) + exp(-r2 * 2.5) * 0.3;
  float a = mix(mote, disc, vLook.y) * vLook.x;
  if (a < 0.004) discard;
  vec3 spirit = mix(uFrost, uGlow, step(0.55, vLook.z)) * 0.3;
  vec3 col = mix(spirit, mix(uMoonColor, uSpirit, 0.25) * 0.22, vLook.y);
  gl_FragColor = vec4(col * a, 1.0);
  #include <colorspace_fragment>
}
