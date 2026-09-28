uniform vec4 uStreamA; // the stream's centreline: z(x) = a.x + a.y·sin(a.z·x + a.w) + b.x·sin(b.y·x + b.z)
uniform vec4 uStreamB; // … and b.w its half-width (layout.ts STREAM)

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

  // the forest floor under snow: drifts lying over dark ground, a cold sheen
  // where they face the moon, and none near the den's fire, where it melted
  vec3 ground = mix(uInk, vec3(0.003, 0.0025, 0.008), 0.5) * (0.8 + 0.4 * mottle);
  float drift = smoothstep(0.25, 0.55, noise2(vWorld.xz * 0.22) * 0.7 + mottle * 0.3);
  drift *= smoothstep(5.0, 13.0, distance(vWorld.xz, uHearth.xz));
  vec3 lying = mix(uFogColor * 1.2, mix(uSpirit, uFrost, 0.4) * 0.032, 0.45 + 0.3 * mottle) + uMoonColor * sheen * 0.01;
  vec3 col = mix(ground, lying + uFrost * glint * 0.06, drift);
  // the path is trodden dark through it
  col = mix(col, ground * 1.3 + uSpirit * 0.004, vMask.x * 0.6);

  // the spirit stream never freezes: dark water glowing blue from within,
  // light drifting downstream, the night sky mirrored in it (cooled a little
  // from the violet mist, so the water keeps its own blue), its banks lit
  // where they meet it
  float sd = streamDistance(vWorld.xz);
  float water = 1.0 - smoothstep(uStreamB.w - 0.3, uStreamB.w + 0.1, sd);
  float bank = exp(-pow((sd - uStreamB.w) / 0.35, 2.0));
  if (water + bank > 0.001) {
    vec3 v = normalize(vWorld - cameraPosition);
    float fres = 0.04 + 0.96 * pow(1.0 - abs(v.y), 5.0);
    vec2 flow = vec2(vWorld.x - uTime * 0.4, vWorld.z);
    float ripple = noise2(flow * vec2(0.7, 2.4)) * 0.6 + noise2(flow * vec2(1.9, 5.0) + 3.0) * 0.4;
    float deep = clamp(1.0 - sd / uStreamB.w, 0.0, 1.0);
    vec3 glow = uGlow * (0.03 + 0.07 * deep) * (0.6 + 0.8 * ripple);
    vec3 w = mix(glow, fogTint(reflect(v, vec3(0.0, 1.0, 0.0))) * vec3(0.55, 1.4, 1.25), fres * 0.6);
    w += uGlow * smoothstep(0.78, 0.92, ripple) * 0.07;
    col = mix(col, w, water);
    col += uGlow * bank * 0.04 * (1.0 - water * 0.5);
  }

  // the snowfield: deep, even snow with a moonlit sheen on the slopes that face it
  vec3 snow = mix(uFogColor, uSpirit * 0.04, 0.45 + 0.3 * mottle) + uMoonColor * sheen * 0.012;
  snow += uMoonColor * glint * 0.12;
  col = mix(col, snow, vMask.y);

  col = hearth(col, vWorld, n);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
