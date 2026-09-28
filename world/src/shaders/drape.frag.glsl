// Each curtain card, cut into hanging strands of uneven length: a frosted
// willow — a dense fall where they leave the branch that parts into single
// strands, dark against the glowing mist, with ice glinting along them.
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

  vec3 col = mix(vec3(0.003, 0.003, 0.009), vec3(0.006, 0.006, 0.019), smoothstep(0.0, 0.7, f));
  col *= 0.65 + 0.7 * fract(h1 * 13.7);
  // ice glinting along the strands, twinkling
  float bead = step(0.9, hash12(vec2(i * 3.1 + sd, floor(below * 26.0))));
  float twinkle = pow(0.5 + 0.5 * sin(uTime * 2.2 + h1 * 40.0 + below * 9.0), 4.0);
  col += uFrost * bead * twinkle * 0.085 * smoothstep(0.2, 0.9, f);

  col = fog(col, vWorldSeed.xyz);
  gl_FragColor = vec4(finish(col), a);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
