// shaders/simPosition.frag
uniform float uDelta;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 pos = texture2D( texturePosition, uv ).xyz;
    vec3 vel = texture2D( textureVelocity, uv ).xyz;

    // simple Euler integration: pos = pos + vel * dt
    pos += vel * uDelta;

    gl_FragColor = vec4(pos, 1.0);
}