varying vec4 vWorldUp;
varying vec3 vNormal;
varying float vRand;

void main() {
  vec3 wpos = vWorldUp.xyz;
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - wpos);

  // slate bark with a faint vertical grain, a little lighter or darker per tree
  float grain = noise2(vec2((wpos.x + wpos.z) * 5.0, wpos.y * 0.7));
  vec3 col = vec3(0.0042, 0.005, 0.0105) * (0.65 + 0.5 * vRand) * (0.8 + 0.45 * grain);

  // the moon and the blossom edge whatever faces them
  float facing = max(dot(n, v), 0.0);
  float rim = pow(1.0 - facing, 3.0) * (0.2 + 0.8 * max(dot(n, uMoonDir), 0.0));
  col += mix(uSpirit, uBloom, 0.35) * rim * 0.035;

  // moss on everything that faces the sky (snow, on the snowy heights)
  float cover = smoothstep(0.35, 0.8, n.y) * smoothstep(0.4, 0.75, noise2(wpos.xz * 1.7 + wpos.y));
  vec3 moss = uGlow * 0.005 + vec3(0.0015, 0.003, 0.004);
  col = mix(col, mix(moss, uMoonColor * 0.04, uSnow), cover * 0.85);

  // teal light where the tree meets the ground: a glow pooled at the roots,
  // and glowing moss creeping up them, breathing slowly
  float root = exp(-max(vWorldUp.w, 0.0) / 0.035);
  float creep = smoothstep(0.45, 0.75, noise2(wpos.xz * 1.1 + wpos.y * 0.6)) * (1.0 - smoothstep(0.0, 0.07, vWorldUp.w));
  float breathe = 0.7 + 0.3 * sin(uTime * 0.8 + vRand * 6.2831);
  col += uGlow * (root * 0.012 + creep * 0.02) * breathe;

  col = hearth(col, wpos, n);
  col = fog(col, wpos);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
