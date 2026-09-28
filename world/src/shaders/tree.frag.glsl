varying vec4 vWorldUp;
varying vec3 vNormal;
varying float vRand;

void main() {
  vec3 wpos = vWorldUp.xyz;
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - wpos);

  // indigo bark with a faint vertical grain, a little lighter or darker per tree
  float grain = noise2(vec2((wpos.x + wpos.z) * 5.0, wpos.y * 0.7));
  vec3 col = vec3(0.0046, 0.0042, 0.0115) * (0.65 + 0.5 * vRand) * (0.8 + 0.45 * grain);

  // the moon edges whatever faces it, and every tree carries a faint glow of
  // its own around its outline: these are spirit trees
  float facing = max(dot(n, v), 0.0);
  float rim = pow(1.0 - facing, 3.0) * (0.2 + 0.8 * max(dot(n, uMoonDir), 0.0));
  col += mix(uSpirit, uFrost, 0.5) * rim * 0.035;
  col += mix(uFrost, uGlow, 0.3) * pow(1.0 - facing, 2.0) * 0.034;

  // snow lying on everything that faces the sky: the roots, the tops of limbs
  float cover = smoothstep(0.2, 0.6, n.y) * smoothstep(0.25, 0.6, noise2(wpos.xz * 1.7 + wpos.y));
  vec3 snow = mix(uSpirit, uMoonColor, 0.5) * (0.045 + 0.03 * max(dot(n, uMoonDir), 0.0));
  col = mix(col, snow, cover * 0.9);

  // spirit light pooled where the tree meets the ground, and seams of it
  // running up through the bark, a slow pulse climbing them, fading as they
  // rise — breathing slowly
  float breathe = 0.7 + 0.3 * sin(uTime * 0.8 + vRand * 6.2831);
  vec3 spirit = mix(uGlow, uFrost, 0.5);
  float root = exp(-max(vWorldUp.w, 0.0) / 0.035);
  // (ridges of a noise that barely changes with height: long vertical
  // seams, broken into lengths by a second noise)
  float seam = 1.0 - abs(noise2(vec2((wpos.x + wpos.z) * 2.2 + vRand * 9.0, wpos.y * 0.06)) * 2.0 - 1.0);
  seam = smoothstep(0.92, 0.985, seam) * smoothstep(0.4, 0.6, noise2(vec2((wpos.x - wpos.z) * 0.8, wpos.y * 0.45)));
  seam *= (1.0 - smoothstep(0.1, 0.6, vWorldUp.w)) * (0.55 + 0.45 * sin(uTime * 1.1 - wpos.y * 0.7 + vRand * 6.2831));
  col += spirit * (root * 0.03 + seam * 0.085) * breathe;

  col = hearth(col, wpos, n);
  col = fog(col, wpos);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
