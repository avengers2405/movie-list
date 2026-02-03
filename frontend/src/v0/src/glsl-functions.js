// GLSL-like math functions for JavaScript

// Clamps value between min and max
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Smooth Hermite interpolation between 0 and 1 when edge0 < x < edge1
export function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// Linear interpolation between a and b
export function mix(a, b, t) {
    return a * (1.0 - t) + b * t;
}

// Mix for vec2
export function mix2(x1, y1, x2, y2, t) {
    return [
        mix(x1, x2, t),
        mix(y1, y2, t)
    ];
}

// Distance between two 2D points
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Length of a 2D vector
export function length(x, y) {
    return Math.sqrt(x * x + y * y);
}

// Normalize a 2D vector
export function normalize(x, y) {
    const len = length(x, y);
    if (len === 0) return [0, 0];
    return [x / len, y / len];
}

// Dot product of two 2D vectors
export function dot(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}

// Returns the fractional part of x
export function fract(x) {
    return x - Math.floor(x);
}

// Returns -1.0, 0.0, or 1.0 depending on the sign of x
export function sign(x) {
    return x > 0 ? 1.0 : x < 0 ? -1.0 : 0.0;
}

// Step function: returns 0 if x < edge, else 1
export function step(edge, x) {
    return x < edge ? 0.0 : 1.0;
}

// Modulo operation
export function mod(x, y) {
    return x - y * Math.floor(x / y);
}

// Maximum of components
export function max(a, b) {
    return Math.max(a, b);
}

// Minimum of components
export function min(a, b) {
    return Math.min(a, b);
}

// Absolute value
export function abs(x) {
    return Math.abs(x);
}

// Rectangle SDF (Signed Distance Function)
// Returns signed distance from point (px, py) to a rectangle centered at origin
// Parameters:
//   px, py: Point coordinates to test
//   bx, by: Half-width and half-height of the rectangle (box extents from center)
// Returns:
//   Negative if point is inside the rectangle
//   Zero if point is on the rectangle boundary
//   Positive if point is outside (distance to nearest edge)
export function sdBox(px, py, bx, by) {
    const dx = Math.abs(px) - bx;
    const dy = Math.abs(py) - by;
    const outside = length(Math.max(dx, 0), Math.max(dy, 0));
    const inside = Math.min(Math.max(dx, dy), 0);
    return outside + inside;
}
