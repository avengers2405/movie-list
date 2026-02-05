import * as THREE from "three";
import * as glsl from "./glsl-functions.js";
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

const frameRate = 0.5; // 5x speed

const BOX_HEIGHT = 0.35;
const BOX_WIDTH = 0.9;

const movies = ["Avengers: Infinity War", "The Avengers", "Avengers: Endgame", "Avengers: Age of Ultron", "Captain America: Civil War", "Iron Man", "Iron Man 2", "Iron Man 3", "Spiderman: Homecoming", "Spiderman: Far From Home", "Spiderman: No Way Home"];

let scrollIndex = 0;
let scrollVelocity = 0;
let uTextStrength = 0.01; // 0 → no text, 1 → fully active
const emptySpaceResistance = 0.1; // resistance every particle will face regardless of anything else

window.addEventListener("wheel", (e) => {
    scrollVelocity += e.deltaY * 0.0005;
});

const TEXT_POINT_COUNT = 120;
const textPoints = new Float32Array(TEXT_POINT_COUNT * 2);

// Create hollow rectangle centered at (0, 0.2) - shifted up by 0.2
const rectWidth = 0.6;
const rectHeight = 0.2;
const halfWidth = rectWidth / 2;
const halfHeight = rectHeight / 2;
const yOffset = 0.0; // Shift up by 0.2
const perimeter = 2 * (rectWidth + rectHeight);

for (let i = 0; i < TEXT_POINT_COUNT; i++) {
    const t = (i / TEXT_POINT_COUNT) * perimeter; // Distance along perimeter
    
    if (t < rectWidth) {
        // Bottom edge: left to right
        textPoints[i * 2 + 0] = -halfWidth + t;
        textPoints[i * 2 + 1] = -halfHeight + yOffset;
    } else if (t < rectWidth + rectHeight) {
        // Right edge: bottom to top
        textPoints[i * 2 + 0] = halfWidth;
        textPoints[i * 2 + 1] = -halfHeight + (t - rectWidth) + yOffset;
    } else if (t < 2 * rectWidth + rectHeight) {
        // Top edge: right to left
        textPoints[i * 2 + 0] = halfWidth - (t - rectWidth - rectHeight);
        textPoints[i * 2 + 1] = halfHeight + yOffset;
    } else {
        // Left edge: top to bottom
        textPoints[i * 2 + 0] = -halfWidth;
        textPoints[i * 2 + 1] = halfHeight - (t - 2 * rectWidth - rectHeight) + yOffset;
    }
}

// Create horizontal line through middle of rectangle
const textPoints2 = new Float32Array(TEXT_POINT_COUNT * 2);

for (let i = 0; i < TEXT_POINT_COUNT; i++) {
    const t = i / (TEXT_POINT_COUNT - 1); // 0 to 1
    textPoints2[i * 2 + 0] = -halfWidth + t * rectWidth; // x: from -halfWidth to halfWidth
    textPoints2[i * 2 + 1] = yOffset; // y: middle of rectangle
}

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------- PARTICLE COUNT ----------
const PARTICLE_COUNT = 200;

// ---------- GEOMETRY ----------
const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = new Float32Array(PARTICLE_COUNT * 3);
const seeds = new Float32Array(PARTICLE_COUNT);
const lockFactor = new Float32Array(PARTICLE_COUNT); // 0 → free, 1 → locked to text

// Initialize particles randomly inside box
for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * (BOX_WIDTH * 0.9);
    positions[i * 3 + 1] = (Math.random() - 0.5) * (BOX_HEIGHT * 0.9);
    positions[i * 3 + 2] = 0;
    velocities[i * 3 + 0] = 0;
    velocities[i * 3 + 1] = 0;
    velocities[i * 3 + 2] = 0;
    seeds[i] = Math.random();
    lockFactor[i] = 0.0;
}

// initialise lock factor

function lockPower(x){
    // returns power of lock between text point and particle if they are at a distance 'x'
    return 1.0 - glsl.smoothstep(0.0, uTextStrength, x);
}

function calcLockFactor(positions, textPoints, lockFactor){
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let factor = 0.0;
        for (let j = 0; j < TEXT_POINT_COUNT; j++) {
            let distance = glsl.distance(
                positions[i * 3 + 0], positions[i * 3 + 1],
                textPoints[j * 2 + 0], textPoints[j * 2 + 1]
            );

            factor += (1 - factor) * (lockPower(distance));
            factor = glsl.clamp(factor, 0.0, 1.0);
        }
        lockFactor[i] = factor;
    }
}
calcLockFactor(positions, textPoints, lockFactor);

console.log("Positions: ", positions);
console.log("Seeds: ", seeds);

function getNextPositionAndVelocity(positions, velocities, textPoints, uTextStrength, dt) {
    const newPositions = new Float32Array(positions.length);
    const newVelocities = new Float32Array(velocities.length);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const xi = positions[i*3];
        const yi = positions[i*3 + 1];

        const vxi = velocities[i*3];
        const vyi = velocities[i*3 + 1];

        // let force (attracion) be const for now
        let ax = 0.0;
        let ay = 0.0;

        for (let j = 0; j < TEXT_POINT_COUNT; j++) {
            let tx = textPoints[j*2];
            let ty = textPoints[j*2 + 1];

            const dist = glsl.distance(xi, yi, tx, ty);
            // console.log('dist: ', dist);
            if (dist > 0.001) {
                ax += (tx - xi) / dist * uTextStrength /dist;
                ay += (ty - yi) / dist * uTextStrength /dist;
            } else {
                ax += 0;
                ay += 0;
            }
        }

        newPositions[i*3] = xi + vxi * dt + 0.5 * ax * dt * dt;
        newPositions[i*3 + 1] = yi + vyi * dt + 0.5 * ay * dt * dt;
        newPositions[i*3 + 2] = 0;

        newVelocities[i*3] = (vxi + ax * dt)*(1-emptySpaceResistance);
        newVelocities[i*3 + 1] = (vyi + ay * dt)*(1-emptySpaceResistance);
        newVelocities[i*3 + 2] = 0;
    }

    return { newPositions, newVelocities };
}

// ---------- RED BORDER ----------
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

const borderGeometry = new THREE.BufferGeometry();
borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderPoints, 3));

const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000, // Red color
    linewidth: 2 // Note: linewidth only works on certain platforms
});

const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
scene.add(borderLines);

// ---------- TEXT POINTS VISUALIZATION ----------
const textPointsGeometry = new THREE.BufferGeometry();
const textPoints3D = new Float32Array(TEXT_POINT_COUNT * 3);

function textPointsTo3D(textPoints, textPoints3D) {
    for (let i = 0; i < TEXT_POINT_COUNT; i++) {
        textPoints3D[i * 3 + 0] = textPoints[i * 2 + 0];
        textPoints3D[i * 3 + 1] = textPoints[i * 2 + 1];
        textPoints3D[i * 3 + 2] = 0;
    }
}
textPointsTo3D(textPoints, textPoints3D);
textPointsGeometry.setAttribute('position', new THREE.BufferAttribute(textPoints3D, 3));

const textPointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff, // White color
    size: 6,
    transparent: true,
    opacity: 0.2
});

const textPointsVis = new THREE.Points(textPointsGeometry, textPointsMaterial);
scene.add(textPointsVis);

geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
);
geometry.setAttribute(
    "seed",
    new THREE.BufferAttribute(seeds, 1)
);
geometry.setAttribute(
    "lockFactor",
    new THREE.BufferAttribute(lockFactor, 1)
);

// ---------- SHADER MATERIAL ----------
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: {
        uTime: { value: 0 },
        uBoxSize: { value: new THREE.Vector2(BOX_WIDTH, BOX_HEIGHT) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending
});

// ---------- POINTS ----------
const particles = new THREE.Points(geometry, material);
scene.add(particles);



// ---------- FPS COUNTER ----------
let lastTime = performance.now();
let frames = 0;
let fps = 0;

// ---------- ANIMATION LOOP ----------
function animate(time = 0) {
    // frame stats
    frames++;
    const now = performance.now();
    const dt = (time * 0.001 * frameRate - material.uniforms.uTime.value);
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        frames = 0;
        lastTime = now;
        console.log(`FPS: ${fps}`);
    }

    // scroll update
    scrollIndex += scrollVelocity;
    scrollVelocity *= 0.9; // damping
    const movieCount = movies.length;
    scrollIndex = (scrollIndex + movieCount) % movieCount;

    // update positions and velocities
    const { newPositions, newVelocities } = getNextPositionAndVelocity(positions, velocities, textPoints, uTextStrength, dt);
    positions.set(newPositions);
    velocities.set(newVelocities);
    geometry.attributes.position.needsUpdate = true;

    // update lock factor
    calcLockFactor(positions, textPoints, lockFactor);
    geometry.attributes.lockFactor.needsUpdate = true;

    // update uTime
    material.uniforms.uTime.value = time * 0.001 * frameRate;

    // render
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
