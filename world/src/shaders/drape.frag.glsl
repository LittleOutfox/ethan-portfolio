// Each curtain card, cut into hanging strands of uneven length: a dense fall
// where they leave the branch that parts into single strands, deep violet at
// the top, magenta through the fall, glowing pink at the tips, with the odd
// blossom lit along them.
varying vec2 vUv;
varying vec4 vWorldSeed;

void main() {
  float sd = vWorldSeed.w * 91.0;
  float x = vUv.x * 11.0;
  float i = floor(x);
  float h1 = hash12(vec2(i, sd));
  float h2 = hash12(vec2(sd, i + 17.0));
  float below = 1.0 - vUv.y;  // 0 at the branch, 1 at the card's hem
  // this strand's length, as a share of the card (a few stop short: gaps)
  float len = h2 < 0.2 ? 0.12 + 0.2 * h1 : 0.4 + 0.6 * h1;
  float f = clamp(below / len, 0.0, 1.0);

  // strands leave the branch as one fall, part, wave a little as they drop,
  // and thin toward the tip
  float cx = 0.5 + (h1 - 0.5) * 0.3 + 0.18 * sin(below * 6.0 + h2 * 6.2831) * below;
  float w = mix(0.62, mix(0.34, 0.1, f), smoothstep(0.04, 0.3, f));
  // leaves along the frond: the strand's edge ripples in and out
  w *= 0.72 + 0.28 * sin(below * 70.0 + h1 * 40.0);
  float edge = (w - abs(fract(x) - cx)) / max(fwidth(x), 1e-4);
  float tip = (len - below) / max(fwidth(below), 1e-4);
  float a = clamp(0.5 + edge, 0.0, 1.0) * clamp(0.5 + tip, 0.0, 1.0);
  #ifdef ALPHA_TO_COVERAGE
    if (a < 0.02) discard;
  #else
    if (a < 0.5) discard;
  #endif

  vec3 col = mix(vec3(0.01, 0.002, 0.022), vec3(0.045, 0.004, 0.034), smoothstep(0.0, 0.55, f));
  col = mix(col, vec3(0.1, 0.012, 0.056), smoothstep(0.5, 0.9, f));
  col *= 0.65 + 0.7 * fract(h1 * 13.7);
  col += uBloom * 0.03 * smoothstep(0.82, 1.0, f); // the tips glow
  // blossoms strung along the strands, glowing and slowly breathing
  float bead = step(0.86, hash12(vec2(i * 3.1 + sd, floor(below * 26.0))));
  float pulse = 0.6 + 0.4 * sin(uTime * 1.3 + h1 * 40.0 + below * 9.0);
  col += uBloom * bead * pulse * 0.05 * smoothstep(0.2, 0.9, f);

  col = fog(col, vWorldSeed.xyz);
  gl_FragColor = vec4(finish(col), a);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
