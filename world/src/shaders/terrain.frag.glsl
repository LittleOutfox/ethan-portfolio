uniform vec4 uStreamA; // the stream's centreline: z(x) = a.x + a.y·sin(a.z·x + a.w) + b.x·sin(b.y·x + b.z)
uniform vec4 uStreamB; // … and b.w its half-width (layout.ts STREAM)
uniform vec3 uWater;
#ifdef BLOOMS
uniform vec4 uBlooms[BLOOMS]; // each spirit bloom's orb (xyz) and scale (w)
#endif

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vMask;

// distance to the stream's centreline, measured across the water
float streamDistance(vec2 xz) {
  float s1 = uStreamA.z * xz.x + uStreamA.w;
  float s2 = uStreamB.y * xz.x + uStreamB.z;
  float zc = uStreamA.x + uStreamA.y * sin(s1) + uStreamB.x * sin(s2);
  float slope = uStreamA.y * uStreamA.z * cos(s1) + uStreamB.x * uStreamB.y * cos(s2);
  return abs(xz.y - zc) * inversesqrt(1.0 + slope * slope);
}

void main() {
  vec3 n = normalize(vNormal);
  float mottle = noise2(vWorld.xz * 0.35) * 0.6 + noise2(vWorld.xz * 1.3) * 0.4;
  float sheen = pow(max(dot(n, uMoonDir), 0.0), 2.0);
  // the odd tiny glint where a crystal catches the light, close by
  vec2 gc = vWorld.xz * 9.0;
  float glint = step(0.9965, hash12(floor(gc))) * smoothstep(0.3, 0.0, length(fract(gc) - 0.5));
  glint *= (0.5 + 0.5 * sin(uTime * 3.0 + vWorld.x * 7.0)) * (1.0 - smoothstep(6.0, 20.0, distance(vWorld, cameraPosition)));

  // the forest floor under deep, soft snow: gentle drifts, brighter where
  // they face the sky and the moon, cool violet in the hollows, a crystal
  // glinting here and there close by — melted only around the den's fire
  vec3 ground = mix(uInk, vec3(0.003, 0.0025, 0.008), 0.5) * (0.8 + 0.4 * mottle);
  float drifts = 0.62 + 0.43 * smoothstep(0.15, 0.85, noise2(vWorld.xz * 0.22) * 0.7 + mottle * 0.3);
  // (shaded as soft mounds: a normal from the slope of a gentle noise, lit
  // from the moon's side, so the snow rolls in light and shade)
  vec2 mq = vWorld.xz * 0.3;
  float m0 = noise2(mq);
  vec3 mound = normalize(vec3((m0 - noise2(mq + vec2(0.06, 0.0))) * 7.0, 1.0, (m0 - noise2(mq + vec2(0.0, 0.06))) * 7.0));
  float soft = 0.6 + 0.4 * max(dot(mound, normalize(vec3(0.2, 0.75, -0.62))), 0.0);
  // (the snow at your feet is the brightest: it fills the bottom of the frame,
  // where the page keeps no text)
  float underfoot = 1.0 - smoothstep(6.0, 18.0, distance(vWorld, cameraPosition));
  vec3 lying = mix(uSpirit, uMoonColor, 0.5) * 0.04 * (1.0 + 0.75 * underfoot) * drifts * soft * (0.75 + 0.25 * clamp(n.y, 0.0, 1.0));
  // (and a fine frost sparkle over it, close by)
  vec2 fc = vWorld.xz * 16.0;
  float frost = step(0.985, hash12(floor(fc))) * smoothstep(0.35, 0.0, length(fract(fc) - 0.5))
              * (0.4 + 0.6 * sin(uTime * 2.0 + hash12(floor(fc) + 7.0) * 30.0)) * (1.0 - smoothstep(4.0, 12.0, distance(vWorld, cameraPosition)));
  lying = mix(lying, uFogColor * 1.3, 0.18) + uMoonColor * sheen * 0.014 + uFrost * (glint * 0.09 + max(frost, 0.0) * 0.08);
  float melt = 1.0 - smoothstep(7.0, 18.0, distance(vWorld.xz, uHearth.xz));
  vec3 col = mix(lying, ground, melt);
  // the path is trodden softly through it, a shade darker
  col = mix(col, col * 0.7, vMask.x * 0.6);

  // the spirit stream never freezes: dark water lit blue-violet from within,
  // of a piece with the mist, light drifting downstream, the night sky
  // mirrored in it, and a rim of thin ice along its banks
  float sd = streamDistance(vWorld.xz);
  float water = 1.0 - smoothstep(uStreamB.w - 0.3, uStreamB.w + 0.1, sd);
  float bank = exp(-pow((sd - uStreamB.w) / 0.35, 2.0));
  if (water + bank > 0.001) {
    vec3 v = normalize(vWorld - cameraPosition);
    float fres = 0.04 + 0.96 * pow(1.0 - abs(v.y), 5.0);
    vec2 flow = vec2(vWorld.x - uTime * 0.4, vWorld.z);
    float ripple = noise2(flow * vec2(0.7, 2.4)) * 0.6 + noise2(flow * vec2(1.9, 5.0) + 3.0) * 0.4;
    float deep = clamp(1.0 - sd / uStreamB.w, 0.0, 1.0);
    vec3 glow = uWater * (0.03 + 0.07 * deep) * (0.6 + 0.8 * ripple);
    vec3 w = mix(glow, fogTint(reflect(v, vec3(0.0, 1.0, 0.0))), fres * 0.6);
    w += mix(uWater, uFrost, 0.4) * smoothstep(0.78, 0.92, ripple) * 0.07;
    col = mix(col, w, water);
    col += mix(uFrost, uMoonColor, 0.4) * bank * 0.03 * (1.0 - water * 0.5);
  }

  // the snowfield: deep, even snow with a moonlit sheen on the slopes that face it
  vec3 snow = mix(uFogColor, uSpirit * 0.04, 0.45 + 0.3 * mottle) + uMoonColor * sheen * 0.012;
  snow += uMoonColor * glint * 0.12;
  col = mix(col, snow, vMask.y);

  #ifdef BLOOMS
  // each spirit bloom's orb lights the snow about it, aqua
  for (int i = 0; i < BLOOMS; i++) {
    vec3 L = uBlooms[i].xyz - vWorld;
    float d = length(L);
    float k = exp(-pow(d / uBlooms[i].w, 2.0) * 0.16) * bloomLight(uBlooms[i].xyz);
    col += uAqua * k * 0.1 * (0.3 + 0.7 * max(dot(n, L / d), 0.0));
  }
  #endif

  col = hearth(col, vWorld, n);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
