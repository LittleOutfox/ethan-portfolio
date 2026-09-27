uniform vec3 uMoonColor;
uniform vec3 uSpirit;
uniform float uSnow;

varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.25, 0.0, dot(c, c)) * vAlpha;
  if (a < 0.004) discard;
  vec3 col = mix(uSpirit, uMoonColor, uSnow) * 0.22;
  gl_FragColor = vec4(col * a, 1.0);
  #include <colorspace_fragment>
}
