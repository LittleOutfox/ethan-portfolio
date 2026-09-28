// The glow about a spirit bloom's orb: light scattered in the cold air,
// brightest just off the orb and fading into the night. Drawn on a shell
// round the orb and added to whatever lies behind; the view ray's closest
// approach to the orb's centre sets how much glow it passes through.
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vCentre;

void main() {
  vec3 ray = normalize(vWorld - cameraPosition);
  vec3 oc = vCentre.xyz - cameraPosition;
  float along = dot(oc, ray);
  float miss = sqrt(max(dot(oc, oc) - along * along, 0.0)) / vCentre.w;
  const float shell = GLOW_R / ORB_R;
  float glow = exp(-max(miss - 0.9, 0.0) * 1.2) * (1.0 - smoothstep(shell * 0.55, shell * 0.97, miss));
  vec3 col = uAqua * glow * bloomLight(vCentre.xyz) * 0.12;
  // dimmed by the mist, and by the page's veil and vignette, like everything else
  col = fog(col, vCentre.xyz) - fog(vec3(0.0), vCentre.xyz);
  col = finish(col) - finish(vec3(0.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
