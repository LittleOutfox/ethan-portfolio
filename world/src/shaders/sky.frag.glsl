varying vec3 vDir;

float noise1(float x) { return noise2(vec2(x, 0.37)); }

// one of the moon's seas: a soft dark patch on its face
float sea(vec2 p, vec2 c, vec2 r) {
  vec2 q = (p - c) / r;
  return exp(-dot(q, q) * 2.0);
}

const float MOON_R = 0.0187; // the disc's angular radius (rad)

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

  // the moon: a full moon with its seas (the darker maria, laid out as on
  // the real one), a faint mottle of craters and bright Tycho below, its edge
  // crisp and a little dimmer toward the limb; round it a faint cold glow
  // and a soft, wide aureole, but no glare (a glare is what makes a disc a sun)
  vec3 mx = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
  vec3 my = cross(mx, uMoonDir);
  vec2 p = vec2(dot(d, mx), dot(d, my)) / MOON_R; // right and up across the disc
  float r = length(p);
  float disc = (1.0 - smoothstep(1.0 - fwidth(r), 1.0 + fwidth(r), r)) * step(0.5, m);
  vec3 face = vec3(0.0);
  if (disc > 0.0) {
    // (the seas' edges wander a little, and they run together as the real ones do)
    vec2 w = p + (vec2(noise2(p * 3.0 + 5.0), noise2(p * 3.0 + 41.0)) - 0.5) * 0.18;
    float seas = sea(w, vec2(-0.52, 0.0), vec2(0.34, 0.62))    // Oceanus Procellarum
               + sea(w, vec2(-0.22, 0.38), vec2(0.3, 0.26))    // Imbrium
               + sea(w, vec2(0.0, 0.72), vec2(0.45, 0.08))     // Frigoris
               + sea(w, vec2(0.18, 0.36), vec2(0.17, 0.16))    // Serenitatis
               + sea(w, vec2(0.32, 0.08), vec2(0.24, 0.2))     // Tranquillitatis
               + sea(w, vec2(0.55, -0.15), vec2(0.15, 0.2))    // Fecunditatis
               + sea(w, vec2(0.3, -0.28), vec2(0.1, 0.1))      // Nectaris
               + sea(w, vec2(0.7, 0.28), vec2(0.11, 0.1))      // Crisium
               + sea(w, vec2(-0.18, -0.34), vec2(0.2, 0.15))   // Nubium
               + sea(w, vec2(-0.45, -0.42), vec2(0.1, 0.1));   // Humorum
    seas = smoothstep(0.15, 0.85, seas + (noise2(p * 7.0 + 17.0) - 0.5) * 0.25);
    float mottle = noise2(p * 14.0 + 3.0) * 0.6 + noise2(p * 31.0 + 9.0) * 0.4;
    vec2 ty = p - vec2(-0.12, -0.66);
    float tycho = exp(-dot(ty, ty) * 900.0) + exp(-dot(ty, ty) * 60.0) * 0.12;
    float albedo = (mix(1.0, 0.7, seas) * (0.92 + 0.1 * mottle) + tycho * 0.25) * (1.0 - 0.18 * r * r);
    face = mix(uMoonColor, uMoonColor * vec3(0.9, 0.93, 1.0), seas) * albedo;
  }
  float halo = pow(m, 3500.0) * 0.06 + pow(m, 140.0) * 0.06 + pow(m, 14.0) * 0.022;
  col += (face * disc * 0.72 + mix(uMoonColor, uFrost, 0.3) * halo) * uMoon;

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
