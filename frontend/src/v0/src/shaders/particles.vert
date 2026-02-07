precision highp float;

attribute float seed;
attribute float lockFactor;

uniform float uTime;
uniform vec2 uBoxSize;

varying float vAlpha;


// -------- RECTANGLE SDF --------
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec3 pos = position;

  // Subtle organic drift
  vec2 drift = vec2(
    sin(uTime + seed * 6.28),
    cos(uTime + seed * 6.28)
  ) * 0.04;

  // pos.xy += drift * (1.0 - lockFactor);

  // --- SDF CONTAINMENT ---
  float sdf = sdBox(pos.xy, uBoxSize);

  if (sdf > 0.0) {
    // Push particle back inside box
    vec2 normal = normalize(pos.xy);
    pos.xy -= normal * sdf;
  }

  // Fade near edges (visual only)
  float edgeDist = abs(sdBox(pos.xy, uBoxSize));
  vAlpha = 1.0;//smoothstep(0.0, 0.2, edgeDist);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 8.0;
}
