varying vec2 vUv;
varying vec4 vWorldSeed;

void main() {
  // a ragged clump of leaves: two octaves of blotches that thin toward the rim
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  float sd = vWorldSeed.w * 37.0;
  float n = noise2(vUv * 6.0 + sd) * 0.62 + noise2(vUv * 14.0 - sd) * 0.38;
  if (n - r * 0.8 < 0.3) discard;

  // deep crimson, with snow dusting the upper leaves
  vec3 col = vec3(0.022, 0.004, 0.007) * (0.7 + 0.6 * noise2(vUv * 3.0 + sd));
  float dust = smoothstep(0.55, 0.95, vUv.y) * smoothstep(0.5, 0.8, noise2(vUv * 9.0 + sd * 2.0));
  col = mix(col, uMoonColor * 0.03, dust * 0.6);

  col = fog(col, vWorldSeed.xyz);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
