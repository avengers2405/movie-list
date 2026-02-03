import * as THREE from "three";
import vertexShaderSource from "./particles.vert?raw";
import fragmentShaderSource from "./particles.frag?raw";

console.log("JS file loaded");

// ---------- BASIC SETUP ----------
const scene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -aspect, aspect, 1, -1, 0.1, 10
);
camera.position.z = 1;

const BOX_HEIGHT = 0.35;
const BOX_WIDTH = 0.9;

const movies = ["Avengers: Infinity War", "The Avengers", "Avengers: Endgame", "Avengers: Age of Ultron", "Captain America: Civil War", "Iron Man", "Iron Man 2", "Iron Man 3", "Spiderman: Homecoming", "Spiderman: Far From Home", "Spiderman: No Way Home"];

let scrollIndex = 0;
let scrollVelocity = 0;

window.addEventListener("wheel", (e) => {
    scrollVelocity += e.deltaY * 0.0005;
});

const TEXT_POINT_COUNT = 120;
const textPoints = new Float32Array(TEXT_POINT_COUNT * 2);
for (let i = 0; i < TEXT_POINT_COUNT; i++) {
    textPoints[i * 2 + 0] = (i / TEXT_POINT_COUNT - 0.5) * 0.6;
    textPoints[i * 2 + 1] = 0.0;
}

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------- PARTICLE COUNT ----------
const PARTICLE_COUNT = 100;

// ---------- GEOMETRY ----------
const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(PARTICLE_COUNT * 3);
const seeds = new Float32Array(PARTICLE_COUNT);

// Initialize particles randomly inside box
for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * (BOX_WIDTH * 0.9);
    positions[i * 3 + 1] = (Math.random() - 0.5) * (BOX_HEIGHT * 0.9);
    positions[i * 3 + 2] = 0;
    seeds[i] = Math.random();
}

console.log("Positions: ", positions);
console.log("Seeds: ", seeds);

geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);
geometry.setAttribute(
    "seed",
    new THREE.BufferAttribute(seeds, 1)
);

// ---------- SHADER MATERIAL ----------
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: {
        uTime: { value: 0 },
        uBoxSize: { value: new THREE.Vector2(BOX_WIDTH, BOX_HEIGHT) },
        uTextStrength: { value: 1.0 }, // 0 → no text, 1 → fully active
        uScrollIndex: { value: 0.0 },
        uTextPoints: { value: textPoints },
    },
    transparent: true,
    blending: THREE.AdditiveBlending
});

// ---------- POINTS ----------
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// ---------- RED BORDER ----------
const borderGeometry = new THREE.BufferGeometry();
const borderPoints = new Float32Array([
    // Bottom left to bottom right
    -BOX_WIDTH / 2, -BOX_HEIGHT / 2, 0,
    BOX_WIDTH / 2, -BOX_HEIGHT / 2, 0,
    // Bottom right to top right
    BOX_WIDTH / 2, -BOX_HEIGHT / 2, 0,
    BOX_WIDTH / 2, BOX_HEIGHT / 2, 0,
    // Top right to top left
    BOX_WIDTH / 2, BOX_HEIGHT / 2, 0,
    -BOX_WIDTH / 2, BOX_HEIGHT / 2, 0,
    // Top left to bottom left
    -BOX_WIDTH / 2, BOX_HEIGHT / 2, 0,
    -BOX_WIDTH / 2, -BOX_HEIGHT / 2, 0,
]);
borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderPoints, 3));

const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000, // Red color
    linewidth: 2 // Note: linewidth only works on certain platforms
});

const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
scene.add(borderLines);

// ---------- FPS COUNTER ----------
let lastTime = performance.now();
let frames = 0;
let fps = 0;

// ---------- ANIMATION LOOP ----------
function animate(time) {
    frames++;
    const now = performance.now();
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        frames = 0;
        lastTime = now;
        console.log(`FPS: ${fps}`);
    }

    scrollIndex += scrollVelocity;
    scrollVelocity *= 0.9; // damping
    const movieCount = movies.length;
    scrollIndex = (scrollIndex + movieCount) % movieCount;

    material.uniforms.uScrollIndex.value = scrollIndex;
    material.uniforms.uTime.value = time * 0.001 * 5.0; // 5x speed
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// ---------- RESIZE ----------
window.addEventListener("resize", () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -aspect;
    camera.right = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
