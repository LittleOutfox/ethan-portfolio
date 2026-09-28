// The spirit fox, drawn as a soft glowing volume: its FOX_BONES round cones
// (the pose fox.ts gives each frame) blended smoothly into one body and
// marched through from the camera. A blue spirit, as in the reference: pale
// blue-white where the moon and the sky reach it, deep blue in its shadows,
// a slow drift of light moving through it, its outline soft and luminous
// (as the ink foxes' lines glow), and its tail dissolving into
// blue foxfire. No halo about it: its light stays within its outline.
// See-through: a spirit, not a creature of flesh.
uniform vec4 uFoxBones[FOX_BONES * 2]; // per bone: (a, ra), (b, rb)
uniform float uFoxFade;                // 0 gone … 1 fully here
uniform vec3 uFoxBoxMin;
uniform vec3 uFoxBoxMax;
uniform float uScale; // px per metre at unit distance
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;

varying vec3 vLocal;
varying vec3 vEye;
varying vec3 vMoon;

// a cone with rounded ends: radius r1 at a, r2 at b (iq)
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float body(vec3 p) {
  float d = 1e5;
  for (int i = 0; i < FOX_BONES; i++) {
    vec4 A = uFoxBones[2 * i];
    vec4 B = uFoxBones[2 * i + 1];
    d = smin(d, sdRoundCone(p, A.xyz, B.xyz, A.w, B.w), 0.03);
  }
  return d;
}

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.002;
  return normalize(k.xyy * body(p + k.xyy * h) + k.yyx * body(p + k.yyx * h)
                 + k.yxy * body(p + k.yxy * h) + k.xxx * body(p + k.xxx * h));
}

float depthOf(vec3 local) {
  vec4 clip = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
  return 0.5 + 0.5 * clip.z / clip.w;
}

void main() {
  vec3 rd = normalize(vLocal - vEye);
  // where the ray leaves the box
  vec3 inv = 1.0 / (rd + vec3(1e-7));
  vec3 t1 = (uFoxBoxMin - vLocal) * inv;
  vec3 t2 = (uFoxBoxMax - vLocal) * inv;
  vec3 tf = max(t1, t2);
  float tExit = min(min(tf.x, tf.y), tf.z);

  float t = 0.0;
  float dMin = 1e5;
  float tNear = 0.0;
  bool hit = false;
  vec3 p = vLocal;
  for (int i = 0; i < 80; i++) {
    p = vLocal + rd * t;
    float d = body(p);
    if (d < dMin) { dMin = d; tNear = t; }
    if (d < 0.001) { hit = true; break; }
    t += max(d * 0.9, 0.002);
    if (t > tExit) break;
  }

  vec3 col = vec3(0.0);
  float a = 0.0;
  vec3 at = vLocal + rd * tNear;
  if (hit) {
    at = p;
    vec3 n = normalAt(p);
    vec3 v = -rd;
    float edge = 1.0 - clamp(dot(n, v), 0.0, 1.0);
    float lit = max(dot(n, vMoon), 0.0);
    float sky = 0.5 + 0.5 * n.y;
    float light = clamp(0.15 + 0.5 * sky + 0.45 * lit, 0.0, 1.0);
    vec3 fur = mix(vec3(0.14, 0.32, 0.85), vec3(0.72, 0.86, 1.0), light * light * (3.0 - 2.0 * light));
    float flow = noise2(vec2(p.x * 7.0 - uTime * 0.35, p.y * 7.0 + p.z * 5.0));
    col = fur * (0.22 + 0.07 * flow) + vec3(0.3, 0.62, 1.0) * pow(edge, 1.5) * 0.46;
    // foxfire flickering out of its tail's tip
    vec3 tip = uFoxBones[2 * (FOX_BONES - 1) + 1].xyz;
    float flame = 1.0 - smoothstep(0.03, 0.3, length(p - tip));
    float flicker = 0.6 + 0.4 * sin(uTime * 9.0 + p.y * 40.0) * sin(uTime * 6.3 + p.z * 31.0);
    col = mix(col, vec3(0.3, 0.6, 1.0) * 0.55 * flicker, flame * 0.8);
    // nearly there in the middle, thinning toward its soft edge
    a = mix(0.62, 0.18, pow(edge, 1.3)) * (1.0 - flame * 0.7 * flicker);
  } else {
    // a near miss: its outline softened over a pixel or two, no further
    float px = length(at - vEye) / uScale;
    float fringe = 1.0 - smoothstep(0.0, px * 1.5, dMin);
    col = vec3(0.3, 0.62, 1.0) * 0.38;
    a = fringe * fringe * 0.18;
  }

  // the mist and the page's veil touch it as they touch everything
  vec3 world = (modelMatrix * vec4(at, 1.0)).xyz;
  col = finish(fog(col, world));
  a *= uFoxFade;
  if (a < 0.001) discard;
  gl_FragDepth = depthOf(at);
  // to the screen's colours, then the see-through body over what lies behind
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * a, a);
}
