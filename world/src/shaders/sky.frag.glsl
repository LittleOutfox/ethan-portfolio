varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  // night gradient: a faint lilac haze at the horizon, ink overhead
  vec3 horizon = uFogColor * 1.15;
  vec3 zenith = mix(uInk, uFogColor, 0.25);
  vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.5, h));

  // the moon: a soft disc and a wide cold halo
  float m = max(dot(d, uMoonDir), 0.0);
  float disc = smoothstep(0.99972, 0.99982, m);
  float halo = pow(m, 1400.0) * 0.45 + pow(m, 90.0) * 0.1 + pow(m, 10.0) * 0.045;
  col += uMoonColor * (disc * 0.8 + halo) * uMoon;

  // inside the forest the roof swallows the upper sky
  col = mix(col, uInk * 0.7, uCanopy * smoothstep(0.02, 0.35, h));

  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
