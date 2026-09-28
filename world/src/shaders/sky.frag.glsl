varying vec3 vDir;

float noise1(float x) { return noise2(vec2(x, 0.37)); }

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float az = atan(d.x, -d.z);

  // a clear winter night: at the horizon the sky is exactly the fog (so
  // distant trees dissolve into it seamlessly), deepening to navy overhead
  vec3 zenith = mix(uInk, uFogColor, 0.35);
  vec3 col = mix(fogTint(d), zenith, smoothstep(0.0, 0.55, h));

  // stars where the sky is open, more of them in the cold clear air
  vec3 q = d * 260.0;
  vec3 cell = floor(q);
  float pick = hash12(cell.xy + cell.z * 19.7);
  float star = step(0.9965, pick) * smoothstep(0.32, 0.0, length(fract(q) - 0.5));
  star *= (0.55 + 0.45 * sin(uTime * (0.8 + pick * 3.0) + pick * 60.0)) * smoothstep(0.06, 0.3, h);
  col += mix(uMoonColor, uFrost, step(0.999, pick)) * star * 0.05;

  // long soft clouds low in the sky, silvered where they pass near the moon
  float m = max(dot(d, uMoonDir), 0.0);
  vec2 cp = vec2(az * 2.2 + uTime * 0.004, h * 9.0);
  float cloud = noise2(cp * vec2(1.0, 1.6)) * 0.65 + noise2(cp * vec2(2.3, 3.1) + 7.0) * 0.35;
  cloud = smoothstep(0.5, 0.8, cloud) * smoothstep(0.03, 0.1, h) * (1.0 - smoothstep(0.22, 0.42, h));
  vec3 belly = uFrost * 0.005 + uMoonColor * pow(m, 10.0) * 0.015 * uMoon;
  col = mix(col, fogTint(d) * 1.02 + belly, cloud * 0.75);

  // the moon: a soft disc and a wide halo
  float disc = smoothstep(0.99978, 0.99987, m);
  float halo = pow(m, 2000.0) * 0.3 + pow(m, 140.0) * 0.07 + pow(m, 14.0) * 0.022;
  col += uMoonColor * (disc * 0.5 + halo) * uMoon;

  // a far tree line painted just above the horizon, half lost in the haze:
  // canopy masses, then crowns, then the ragged tops of single trees
  float ridge = 0.028 + 0.024 * noise1(az * 4.0) + 0.014 * noise1(az * 17.0)
              + 0.016 * pow(noise1(az * 61.0), 3.0) + 0.008 * pow(noise1(az * 173.0), 2.0);
  float tree = 1.0 - smoothstep(ridge - 0.003, ridge + 0.003, h);
  col = mix(col, mix(fogTint(d), uInk, 0.4), tree);

  // inside the forest the canopy hides the upper sky, but the mist glows
  // through it (so the hanging branches stand dark against it), brighter
  // where the canopy thins
  vec2 rp = d.xz / max(h, 0.08) * 2.5;
  float leaf = noise2(rp) * 0.6 + noise2(rp * 3.1 + 3.0) * 0.4;
  vec3 roof = fogTint(d) * mix(0.55, 0.95, smoothstep(0.35, 0.75, leaf));
  roof += uFrost * 0.006 * smoothstep(0.78, 0.92, leaf);
  col = mix(col, roof, uCanopy * smoothstep(0.02, 0.35, h));

  gl_FragColor = vec4(finish(col), 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += dither();
}
