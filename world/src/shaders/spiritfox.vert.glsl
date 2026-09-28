// The box the spirit fox is drawn in: its surface, the camera and the moon's
// direction, all in the fox's own space (where its pose is given).
uniform vec3 uMoonDir;

varying vec3 vLocal;
varying vec3 vEye;
varying vec3 vMoon;

void main() {
  mat4 toFox = inverse(modelMatrix);
  vLocal = position;
  vEye = (toFox * vec4(cameraPosition, 1.0)).xyz;
  vMoon = normalize((toFox * vec4(uMoonDir, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
