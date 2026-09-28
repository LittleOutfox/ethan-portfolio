// Lit by its own orb: aqua light falling off from the orb's centre, on the
// sides that face it. The bark is dark slate, edged by the moon, with snow
// lying along the roots; the leaves are a deep jade paling toward their
// tips, with a brighter midrib and fine veins, frost along their edges.
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vOrb;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  #ifdef LEAF
    if (!gl_FrontFacing) n = -n;
    float across = abs(vUv.x);
    float rib = 1.0 - smoothstep(0.0, 0.12, across);
    float veins = (1.0 - smoothstep(0.0, 0.1, abs(fract(vUv.y * 7.0 - across * 1.6) - 0.5))) * (1.0 - rib) * (1.0 - smoothstep(0.6, 0.95, across));
    vec3 col = mix(vec3(0.004, 0.011, 0.012), vec3(0.014, 0.036, 0.03), smoothstep(0.1, 1.0, vUv.y));
    col += vec3(0.006, 0.016, 0.014) * (rib + veins * 0.5);
    col += uFrost * smoothstep(0.75, 1.0, across) * 0.012;
  #else
    float grain = noise2(vec2(vWorld.x * 30.0 + vWorld.z * 30.0, vWorld.y * 6.0));
    vec3 col = vec3(0.0045, 0.0065, 0.011) * (0.75 + 0.5 * grain);
  #endif

  // the orb's light
  vec3 L = vOrb.xyz - vWorld;
  float d = length(L);
  float lit = bloomLight(vOrb.xyz) * exp(-d / vOrb.w * 2.4);
  #ifdef LEAF
    col += uAqua * lit * 0.45 * (0.35 + 0.65 * max(dot(n, L / d), 0.0));
  #else
    col += uAqua * lit * 0.32 * (0.3 + 0.7 * max(dot(n, L / d), 0.0));
  #endif

  // the moon edges whatever faces it
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * (0.2 + 0.8 * max(dot(n, uMoonDir), 0.0));
  col += mix(uSpirit, uFrost, 0.5) * rim * 0.03;
  #ifndef LEAF
    // snow lying along the tops of the roots
    float cover = smoothstep(0.35, 0.75, n.y) * (1.0 - smoothstep(0.12, 0.25, vUv.y));
    col = mix(col, mix(uSpirit, uMoonColor, 0.5) * 0.045, cover * 0.85);
  #endif

  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
