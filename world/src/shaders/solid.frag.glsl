// Stone steps and torii: one flat colour, edged by the moon, moss on top
// (snow, on the snowy heights).
uniform vec3 uColor;
uniform vec3 uRimColor;

varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  vec3 col = uColor * (0.85 + 0.3 * noise2(vWorld.xz * 2.0 + vWorld.y));
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * (0.3 + 0.7 * max(dot(n, uMoonDir), 0.0));
  col += uRimColor * rim;
  float cover = smoothstep(0.5, 0.9, n.y) * smoothstep(0.3, 0.7, noise2(vWorld.xz * 3.0));
  vec3 moss = uGlow * 0.005 + vec3(0.0015, 0.003, 0.004);
  col = mix(col, mix(moss, uMoonColor * 0.03, uSnow), cover * 0.85);
  col = hearth(col, vWorld, n);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
