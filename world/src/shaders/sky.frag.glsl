varying vec3 vDir;

float noise1(float x) { return noise2(vec2(x, 0.37)); }

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  // night gradient: at the horizon the sky is exactly the fog (so distant
  // trees dissolve into it seamlessly), ink overhead
  vec3 zenith = mix(uInk, uFogColor, 0.25);
  vec3 col = mix(fogTint(d), zenith, smoothstep(0.0, 0.5, h));

  // the moon: a soft disc and a wide cold halo
  float m = max(dot(d, uMoonDir), 0.0);
  float disc = smoothstep(0.99978, 0.99987, m);
  float halo = pow(m, 2000.0) * 0.3 + pow(m, 140.0) * 0.07 + pow(m, 14.0) * 0.035;
  col += uMoonColor * (disc * 0.5 + halo) * uMoon;

  // a far tree line painted just above the horizon, half lost in the haze
  float az = atan(d.x, -d.z);
  // canopy masses, then crowns, then the ragged tops of single trees
  float ridge = 0.028 + 0.024 * noise1(az * 4.0) + 0.014 * noise1(az * 17.0)
              + 0.016 * pow(noise1(az * 61.0), 3.0) + 0.008 * pow(noise1(az * 173.0), 2.0);
  float tree = 1.0 - smoothstep(ridge - 0.003, ridge + 0.003, h);
  col = mix(col, mix(fogTint(d), uInk, 0.4), tree);

  // inside the forest the roof swallows the upper sky
  col = mix(col, uInk * 0.7, uCanopy * smoothstep(0.02, 0.35, h));

  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
