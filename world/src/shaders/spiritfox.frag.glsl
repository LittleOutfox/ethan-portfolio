// The spirit fox, drawn as a soft glowing volume: its FOX_BONES round cones
// (the pose fox.ts gives each frame) blended smoothly into one body and
// marched through from the camera. As the spirit foxes of the reference:
// moonlight-white fur that glows azure toward its edges (as the ink foxes'
// lines glow), bright eyes, foxfire flickering out of its tail's tip, and a
// faint aura about it. It is a little see-through: a spirit.
uniform vec4 uFoxBones[FOX_BONES * 2]; // per bone: (a, ra), (b, rb)
uniform vec4 uFoxEyes[2];              // (centre, radius)
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

  // the aura: light gathered where the ray passes near the fox (gone well
  // before the edge of the box it is drawn in, so no box ever shows)
  vec3 azure = vec3(0.34, 0.66, 1.0);
  vec3 aura = azure * exp(-max(dMin, 0.0) / 0.045) * 0.09 * (1.0 - smoothstep(0.05, 0.1, dMin));

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
    // moonlight-white fur where the moon and sky reach it, lavender-blue in
    // its shadows, a fine mottle of fur, and azure glowing along its edges
    float light = clamp(0.12 + 0.5 * sky + 0.5 * lit, 0.0, 1.0);
    vec3 fur = mix(vec3(0.2, 0.28, 0.64), vec3(0.96, 0.97, 1.0), light * light * (3.0 - 2.0 * light));
    fur *= 0.88 + 0.24 * noise2(vec2(p.x * 90.0 + p.z * 55.0, p.y * 130.0));
    col = fur * 0.22 + azure * pow(edge, 2.0) * 0.5 + vec3(0.55, 0.8, 1.0) * pow(edge, 6.0) * 0.24;
    // its eyes: two small bright lights
    for (int e = 0; e < 2; e++) {
      float de = length(p - uFoxEyes[e].xyz) / uFoxEyes[e].w;
      col += vec3(0.75, 0.95, 1.0) * (1.0 - smoothstep(0.5, 1.0, de)) * 0.5;
    }
    // foxfire flickering out of its tail's tip
    vec3 tip = uFoxBones[2 * (FOX_BONES - 1) + 1].xyz;
    float flame = 1.0 - smoothstep(0.02, 0.22, length(p - tip));
    float flicker = 0.6 + 0.4 * sin(uTime * 9.0 + p.y * 40.0) * sin(uTime * 6.3 + p.z * 31.0);
    col = mix(col, azure * 0.55 * flicker, flame * 0.75);
    a = mix(0.92, 0.62, edge) * (1.0 - flame * 0.45 * flicker);
  } else {
    // a near miss: the soft, feathered fringe of its fur round the silhouette
    // (about a pixel of softening there, and strands a little longer)
    float px = length(at - vEye) / uScale;
    float strands = noise2(vec2(at.x * 75.0 + at.z * 45.0, at.y * 75.0));
    float fringe = 1.0 - smoothstep(0.0, px * 1.5 + 0.012 * strands, dMin);
    col = mix(vec3(0.7, 0.8, 1.0), azure, 0.55) * 0.34;
    a = fringe * 0.6;
  }

  // the mist and the page's veil touch it as they touch everything
  vec3 world = (modelMatrix * vec4(at, 1.0)).xyz;
  col = finish(fog(col, world));
  aura = fog(aura, world) - fog(vec3(0.0), world);
  aura = finish(aura) - finish(vec3(0.0));
  a *= uFoxFade;
  if (a < 0.001 && max(aura.r, max(aura.g, aura.b)) < 0.0004) discard;
  gl_FragDepth = depthOf(at);
  // each part to the screen's colours on its own, then the see-through body over what lies behind, the aura added
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  vec3 furOut = gl_FragColor.rgb;
  gl_FragColor = vec4(aura, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(furOut * a + gl_FragColor.rgb * uFoxFade, a);
}
