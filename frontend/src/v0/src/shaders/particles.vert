uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform vec2 uBoxSize;

attribute vec2 reference; // The UV coordinate to look up this particle

varying float vAlpha;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  // Read position from the FBO
  vec4 posData = texture2D(texturePosition, reference); 
  vec3 pos = posData.xyz;
  
  // Optional: Read velocity if you want to stretch particles based on speed
  // vec3 vel = texture2D(textureVelocity, reference).xyz;

  float sdf = sdBox(pos.xy, uBoxSize);
  
  // Note: Pushing back inside box should technically happen in simVelocity.frag now, 
  // but doing it visually here is cheaper if you just want to hide them.
  
  vAlpha = 1.0; 

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 20.0; // Increased from 8.0 for visibility
}