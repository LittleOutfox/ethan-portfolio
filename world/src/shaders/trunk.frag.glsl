varying vec3 vWorld;
varying vec3 vNormal;
varying float vUp;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  // ink silhouettes, edged by the moon on the side that faces it
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * max(dot(n, uMoonDir), 0.0);
  vec3 col = uInk * 0.8 + uSpirit * rim * 0.1;
  // old snow banked at the roots
  col = mix(col, uMoonColor * 0.05, smoothstep(0.06, 0.0, vUp) * 0.6);
  col = fog(col, vWorld);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
