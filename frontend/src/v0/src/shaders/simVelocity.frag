// shaders/simVelocity.frag
uniform float uTime;
uniform float uDelta; // dt
uniform float uTextStrength;
uniform float uResistance; // emptySpaceResistance
uniform sampler2D textureText; // Data texture containing text points
uniform int uTextPointCount;   // Actual number of text points
uniform float uMaxTextPoints;  // Resolution of the text texture

void main() {
    // Get current UV for this particle
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Fetch current position and velocity from the FBO's internal state
    vec3 pos = texture2D( texturePosition, uv ).xyz;
    vec3 vel = texture2D( textureVelocity, uv ).xyz;

    vec3 acceleration = vec3(0.0);

    // --- PHYSICS LOGIC (Migrated from JS) ---
    // Iterate over text points to calculate attraction
    // We loop through the texture containing text coordinates
    for (int i = 0; i < 200; i++) { // Hardcoded max loop for safety, or use uniform
        if (i >= uTextPointCount) break;

        // map index to UV coordinates for the 1D text texture
        float textUV = (float(i) + 0.5) / uMaxTextPoints;
        vec3 targetPos = texture2D(textureText, vec2(textUV, 0.5)).xyz;

        float dist = distance(pos.xy, targetPos.xy);

        if (dist > 0.001) {
            // F = (target - current) / dist * strength / dist
            vec2 direction = (targetPos.xy - pos.xy) / dist;
            acceleration.xy += direction * (uTextStrength / dist);
        }
    }

    // Apply Acceleration
    vel += acceleration * uDelta;

    // Apply Resistance
    vel *= (1.0 - uResistance);

    gl_FragColor = vec4(vel, 1.0);
}