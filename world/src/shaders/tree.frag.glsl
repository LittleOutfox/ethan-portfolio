varying vec4 vWorldUp;
varying vec3 vNormal;
varying float vRand;

void main() {
  vec3 wpos = vWorldUp.xyz;
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - wpos);

  // ink bark with a faint vertical grain, a little lighter or darker per tree
  float grain = noise2(vec2((wpos.x + wpos.z) * 5.0, wpos.y * 0.7));
  vec3 col = uInk * (0.6 + 0.45 * vRand) * (0.8 + 0.45 * grain);

  // the moon edges whatever faces it
  float facing = max(dot(n, v), 0.0);
  float rim = pow(1.0 - facing, 3.0) * (0.2 + 0.8 * max(dot(n, uMoonDir), 0.0));
  col += uSpirit * rim * 0.04;

  // old snow on everything that faces the sky: roots, the tops of limbs
  float cover = smoothstep(0.35, 0.8, n.y) * smoothstep(0.35, 0.75, noise2(wpos.xz * 1.7 + wpos.y));
  col = mix(col, uMoonColor * 0.04, cover * 0.9);

  col = hearth(col, wpos, n);
  col = fog(col, wpos);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
