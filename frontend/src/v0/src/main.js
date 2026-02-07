import { init } from "./core/main.js";
import { Particles } from "./components/particles.js";
import { BoundingBox } from "./components/bounding-box.js";
import { RectText } from "./components/rect-text.js";

console.log("JS file loaded");
const movies = ["Avengers: Infinity War", "The Avengers", "Avengers: Endgame", "Avengers: Age of Ultron", "Captain America: Civil War", "Iron Man", "Iron Man 2", "Iron Man 3", "Spiderman: Homecoming", "Spiderman: Far From Home", "Spiderman: No Way Home"];

const { scene, camera, renderer } = init();

const frameRate = 0.5; // 5x speed

let scrollIndex = 0;
let scrollVelocity = 0;
let uTextStrength = 0.01; // 0 → no text, 1 → fully active
const emptySpaceResistance = 0.1; // resistance every particle will face regardless of anything else

const BOX_HEIGHT = 0.35;
const BOX_WIDTH = 0.9;
const TEXT_POINT_COUNT = 120;

// Sample Text Params
const rectWidth = 0.6;
const rectHeight = 0.2;
const yOffset = 0.0;
const xOffset = 0.0;

const boundingBox = new BoundingBox(scene, BOX_HEIGHT, BOX_WIDTH);

const text = new RectText(scene, TEXT_POINT_COUNT, rectHeight, rectWidth, yOffset, xOffset);

const particles = new Particles(scene, BOX_HEIGHT, BOX_WIDTH, text.textPoints, uTextStrength);

// ---------- FPS COUNTER ----------
let lastTime = performance.now();
let frames = 0;
let fps = 0;

// ---------- ANIMATION LOOP ----------
function animate(time = 0) {
    // frame stats
    frames++;
    const now = performance.now();
    const dt = (time * 0.001 * frameRate - particles.material.uniforms.uTime.value);
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

    // update positions and velocities and lock factor
    particles.setNextPositionVelocityLockFactor(text.textPoints, uTextStrength, dt, emptySpaceResistance);

    // update uTime
    particles.material.uniforms.uTime.value = time * 0.001 * frameRate;

    // render
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
