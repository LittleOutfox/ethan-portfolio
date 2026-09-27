varying vec4 vColor;

void main() {
  // a bright core in a wide soft halo
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  float a = (exp(-r2 * 18.0) + exp(-r2 * 3.5) * 0.35) * vColor.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor.rgb * a * 0.55, 1.0);
  #include <colorspace_fragment>
}
