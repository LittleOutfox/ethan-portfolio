// A spirit bloom's orb: translucent aqua, brightest toward its rim, a pale
// wisp curling out from its heart and turning slowly, a glint of the moon on
// its crown; it breathes with the bloom.
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vCentre;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(cameraPosition - vWorld);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.2);

  // the orb's face as the viewer sees it: q runs −1..1 across the disc
  vec3 toCam = normalize(cameraPosition - vCentre.xyz);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
  vec3 up = cross(toCam, right);
  vec3 off = vWorld - vCentre.xyz;
  vec2 q = vec2(dot(off, right), dot(off, up)) / vCentre.w;
  float r = length(q);
  // the wisp: one arm of a spiral, curling out from the heart
  float spin = uTime * 0.35 + vCentre.x * 1.7 + vCentre.z * 1.3;
  float arm = abs(fract((atan(q.y, q.x) + spin - 3.4 * log(r + 0.03)) / 6.2831853) - 0.5);
  float wisp = (1.0 - smoothstep(0.05, 0.15, arm)) * smoothstep(0.06, 0.2, r) * (1.0 - smoothstep(0.55, 0.85, r));
  float heart = exp(-r * r * 9.0);

  vec3 pale = mix(uAqua, vec3(1.0), 0.55);
  vec3 col = uAqua * (0.12 + 0.5 * rim + 0.25 * heart) + pale * (wisp * 0.42 + heart * 0.16);
  col += uMoonColor * pow(max(dot(reflect(-v, n), uMoonDir), 0.0), 40.0) * 0.25;
  col *= bloomLight(vCentre.xyz);

  col = mix(col, fog(col, vWorld), 0.6);
  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
