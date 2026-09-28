varying vec2 vUv;
varying vec4 vWorldSeed;

void main() {
  // a ragged clump of blossom: two octaves of blotches that thin toward the rim
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float sd = vWorldSeed.w * 37.0;
  float n = noise2(vUv * 6.0 + sd) * 0.62 + noise2(vUv * 14.0 - sd) * 0.38;
  float e = n - r * 0.8 - 0.3;
  float a = clamp(0.5 + e / max(fwidth(e), 1e-4), 0.0, 1.0);
  #ifdef ALPHA_TO_COVERAGE
    if (a < 0.02) discard;
  #else
    if (a < 0.5) discard;
  #endif

  // violet deepening to plum, with a few flowers catching the light
  vec3 col = mix(vec3(0.011, 0.003, 0.024), vec3(0.03, 0.004, 0.034), noise2(vUv * 3.0 + sd));
  col += uBloom * smoothstep(0.8, 0.95, noise2(vUv * 22.0 + sd * 3.0)) * 0.02;
  // on the snowy heights, snow dusts the upper leaves
  float dust = smoothstep(0.55, 0.95, vUv.y) * smoothstep(0.5, 0.8, noise2(vUv * 9.0 + sd * 2.0));
  col = mix(col, uMoonColor * 0.03, dust * 0.6 * uSnow);

  col = fog(col, vWorldSeed.xyz);
  gl_FragColor = vec4(finish(col), a);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
