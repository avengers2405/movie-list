precision highp float;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  // Soft circular particle
  float alpha = smoothstep(0.5, 0.0, d);

  vec3 color = vec3(1.0, 0.4, 0.1); // Iron-man orange
  gl_FragColor = vec4(color, alpha * vAlpha);
}
