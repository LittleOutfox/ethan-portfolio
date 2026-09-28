// A magical flower: two rings of pointed petals (the inner turned between
// the outer), each deep blue at its base and paling to its tip with a
// brighter vein down its middle, a ring of stamens round a bright heart, and
// a soft glow about it all.
uniform vec3 uAqua;
uniform vec3 uGlow;

varying float vStrength;
varying float vSpin;

void main() {
  vec2 c = (gl_PointCoord - 0.5) * 2.0;
  float r = length(c);
  float th = atan(c.y, c.x) + vSpin;

  float lobeOut = pow(abs(cos(3.0 * th)), 0.7);
  float outer = 1.0 - smoothstep(0.18 + 0.5 * lobeOut, 0.24 + 0.5 * lobeOut, r);
  float lobeIn = pow(abs(cos(3.0 * th + 0.5236)), 0.7);
  float inner = 1.0 - smoothstep(0.1 + 0.3 * lobeIn, 0.15 + 0.3 * lobeIn, r);
  float vein = exp(-pow(sin(3.0 * th) * r * 7.0, 2.0)) * outer;

  vec3 pale = mix(uAqua, vec3(1.0), 0.45);
  vec3 petal = mix(uGlow, pale, smoothstep(0.08, 0.66, r));
  vec3 col = petal * (outer * 0.3 + inner * 0.3 + vein * 0.25);

  // stamens: a ring of eight small points round the heart
  float a8 = mod(th, 0.7854) - 0.3927;
  float stamen = 1.0 - smoothstep(0.018, 0.04, length(vec2(cos(a8), sin(a8)) * r - vec2(0.17, 0.0)));
  col += pale * stamen * 0.7 + vec3(1.0) * exp(-r * r * 70.0) * 0.9;
  col += uAqua * exp(-r * r * 3.5) * 0.18;

  col *= vStrength * (1.0 - smoothstep(0.8, 1.0, r));
  if (max(col.r, max(col.g, col.b)) < 0.002) discard;
  gl_FragColor = vec4(col * 0.6, 1.0);
  #include <colorspace_fragment>
}
