varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vMask;

void main() {
  vec3 n = normalize(vNormal);
  float mottle = noise2(vWorld.xz * 0.35) * 0.6 + noise2(vWorld.xz * 1.3) * 0.4;

  // the forest floor: ink with old snow lying in patches
  vec3 col = uInk * (0.8 + 0.35 * mottle);
  float patchy = smoothstep(0.55, 0.8, noise2(vWorld.xz * 0.22) * 0.7 + mottle * 0.3);
  col = mix(col, uSpirit * 0.018, patchy * 0.8);
  // the path is worn pale under the moon
  col = mix(col, uSpirit * 0.026, vMask.x * 0.55);

  // the snowfield: blue snow, a moonlit sheen on the slopes that face it,
  // and the odd glint where a crystal catches the light
  float sheen = pow(max(dot(n, uMoonDir), 0.0), 2.0);
  vec3 snow = mix(uFogColor * 1.3, uSpirit * 0.04, 0.35 + 0.35 * mottle) + uMoonColor * sheen * 0.01;
  float glint = step(0.9965, hash12(floor(vWorld.xz * 9.0))) * (0.5 + 0.5 * sin(uTime * 3.0 + vWorld.x * 7.0));
  snow += uMoonColor * glint * 0.08 * vMask.y;
  col = mix(col, snow, vMask.y);

  col = hearth(col, vWorld, n);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
