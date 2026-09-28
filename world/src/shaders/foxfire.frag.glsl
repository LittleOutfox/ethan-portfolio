varying vec4 vColor;
varying float vOrb;

void main() {
  vec2 c = (gl_PointCoord - 0.5) * 2.0; // −1..1 across the sprite, +y down
  float r2 = dot(c, c);
  // lights: a bright core in a wide soft halo
  float light = exp(-r2 * 18.0) + exp(-r2 * 3.5) * 0.35;
  // orbs: a small bright heart in a soft glow, with only a hint of the
  // sphere around it (a faint body, its edge a touch brighter). Little of an
  // orb is bright, so text it drifts behind stays legible.
  float r = sqrt(r2);
  const float R = 0.55;
  float inside = 1.0 - smoothstep(R - 0.05, R + 0.02, r);
  float heart = exp(-r2 * 26.0);
  float edge = exp(-pow((r - R) / 0.07, 2.0)) * 0.07;
  float halo = exp(-r2 * 4.0) * 0.12;
  float orb = inside * 0.035 + heart + edge + halo;

  // everything fades out before the sprite's edge, so no glow is ever cut square
  float a = mix(light, orb, vOrb) * vColor.a * (1.0 - smoothstep(0.7, 1.0, r));
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor.rgb * a * 0.55, 1.0);
  #include <colorspace_fragment>
}
