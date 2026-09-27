varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vMask;

void main() {
  vec3 n = normalize(vNormal);
  // leaf litter and old snow: low-frequency patches in the ink
  float mottle = hash12(floor(vWorld.xz * 0.7)) * 0.5 + hash12(floor(vWorld.xz * 2.3)) * 0.5;
  vec3 col = uInk * (0.85 + 0.3 * mottle);
  // moonlight grazing the ground
  float lit = max(dot(n, uMoonDir), 0.0);
  col += uSpirit * lit * 0.012;
  // the path is worn pale; the snowfield is snow
  col = mix(col, uSpirit * 0.05, vMask.x * 0.6);
  col = mix(col, uMoonColor * (0.07 + 0.02 * mottle), vMask.y);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
