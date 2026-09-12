// Analytic two-lobe sprite: a tight core and a wide faint halo. No texture, no discard.

varying vec4 vColorAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = 1.0 - smoothstep(0.0, 0.2, d);
  core = core * core * core;
  float halo = 1.0 - smoothstep(0.0, 0.5, d);
  halo = halo * halo;
  float a = vColorAlpha.a * (core + halo * 0.12);
  // premultiplied output. The sRGB encode below runs on rgb * a, so alpha is gamma-encoded by
  // design: the halo and the released dust read brighter than their linear weights, and every
  // alpha constant in the vertex shader was tuned by eye against that. Retune if this changes.
  gl_FragColor = vec4(vColorAlpha.rgb * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
