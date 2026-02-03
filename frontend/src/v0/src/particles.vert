precision highp float;

attribute float seed;

uniform float uTime;
uniform vec2 uBoxSize;
uniform float uTextStrength;
uniform float uScrollIndex;
uniform float uTextPoints[240];

varying float vAlpha;


// -------- RECTANGLE SDF --------
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// -------- SIMPLE NOISE --------
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec2 getTextPoint(int i, float ghostY) {
  return vec2(
    uTextPoints[i * 2],
    uTextPoints[i * 2 + 1] + ghostY
  );
}

void main() {
  vec3 pos = position;

  // Subtle organic drift
  // float n = hash(seed + uTime * 0.1);
  vec2 drift = vec2(
    sin(uTime + seed * 6.28),
    cos(uTime + seed * 6.28)
  ) * 0.04;

  //pos.xy += drift * (1.0 - uTextStrength);

  // --- SDF CONTAINMENT ---
  float sdf = sdBox(pos.xy, uBoxSize);

  if (sdf > 0.0) {
    // Push particle back inside box
    vec2 normal = normalize(pos.xy);
    pos.xy -= normal * sdf;
  }

  vec2 bestTarget = pos.xy;
  float bestDist = 999.0;

  float ghostY = -fract(uScrollIndex) * uBoxSize.y;

  for (int i = 0; i < 120; i++) {
    vec2 tp = getTextPoint(i, ghostY);
    float d = distance(pos.xy, tp);
    if (d < bestDist) {
      bestDist = d;
      bestTarget = tp;
    }
  }

  float attract = 1.0 - smoothstep(0.0, 0.25, bestDist);
  pos.xy = mix(pos.xy, bestTarget, attract * uTextStrength);
  // pos.xy = bestTarget;

  // Fade near edges (visual only)
  float edgeDist = abs(sdBox(pos.xy, uBoxSize));
  vAlpha = smoothstep(0.0, 0.2, edgeDist);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 8.0;
}
