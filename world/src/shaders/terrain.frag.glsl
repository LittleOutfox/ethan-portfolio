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

  // the forest floor: violet-ink, with moss that glows teal in patches and breathes
  vec3 col = mix(uInk, vec3(0.004, 0.002, 0.008), 0.5) * (0.8 + 0.4 * mottle);
  float patchy = smoothstep(0.6, 0.82, noise2(vWorld.xz * 0.22) * 0.7 + mottle * 0.3);
  float breathe = 0.75 + 0.25 * sin(uTime * 0.7 + noise2(vWorld.xz * 0.05) * 12.0);
  col = mix(col, uGlow * 0.014 * breathe, patchy * 0.8);
  // the path is worn pale, lavender under the haze
  col = mix(col, mix(uSpirit, uBloom, 0.25) * 0.024, vMask.x * 0.55);

  // the spirit stream: dark water glowing teal from within, ripples drifting
  // downstream, the rose sky mirrored in it, its banks lit where they meet it
  float sd = streamDistance(vWorld.xz);
  float water = 1.0 - smoothstep(uStreamB.w - 0.3, uStreamB.w + 0.1, sd);
  float bank = exp(-pow((sd - uStreamB.w) / 0.35, 2.0));
  if (water + bank > 0.001) {
    vec3 v = normalize(vWorld - cameraPosition);
    float fres = 0.04 + 0.96 * pow(1.0 - abs(v.y), 5.0);
    vec2 flow = vec2(vWorld.x - uTime * 0.4, vWorld.z);
    float ripple = noise2(flow * vec2(0.7, 2.4)) * 0.6 + noise2(flow * vec2(1.9, 5.0) + 3.0) * 0.4;
    float deep = clamp(1.0 - sd / uStreamB.w, 0.0, 1.0);
    vec3 glow = uGlow * (0.025 + 0.06 * deep) * (0.6 + 0.8 * ripple);
    vec3 w = mix(glow, fogTint(reflect(v, vec3(0.0, 1.0, 0.0))) * 1.3, fres * 0.6);
    w += uGlow * smoothstep(0.78, 0.92, ripple) * 0.06;
    col = mix(col, w, water);
    col += uGlow * bank * 0.035 * (1.0 - water * 0.5);
  }

  // the snowfield: cool lavender snow, a moonlit sheen on the slopes that face
  // it, and the odd tiny glint where a crystal catches the light
  float sheen = pow(max(dot(n, uMoonDir), 0.0), 2.0);
  vec3 snow = mix(uFogColor * 1.1, uSpirit * 0.045, 0.45 + 0.3 * mottle) + uMoonColor * sheen * 0.012;
  vec2 gc = vWorld.xz * 9.0;
  float glint = step(0.9965, hash12(floor(gc))) * smoothstep(0.3, 0.0, length(fract(gc) - 0.5));
  glint *= (0.5 + 0.5 * sin(uTime * 3.0 + vWorld.x * 7.0)) * (1.0 - smoothstep(6.0, 20.0, distance(vWorld, cameraPosition)));
  snow += uMoonColor * glint * 0.12 * vMask.y;
  col = mix(col, snow, vMask.y);

  col = hearth(col, vWorld, n);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
