import { Init } from "./core/main.js";
import { Particles } from "./components/particles.js";
import { BoundingBox } from "./components/bounding-box.js";
import { RectText } from "./components/rect-text.js";
import { TextString } from "./components/text.js";

console.log("JS file loaded");
const movies = ["Orbitron", "Avengers: Infinity War", "The Avengers", "Avengers: Endgame", "Avengers: Age of Ultron", "Captain America: Civil War", "Iron Man", "Iron Man 2", "Iron Man 3", "Spiderman: Homecoming", "Spiderman: Far From Home", "Spiderman: No Way Home"];

const stage = new Init();

const frameRate = 0.5; // 5x speed

let uTextStrength = 0.0001; // 0 → no text, 1 → fully active
const emptySpaceResistance = 0.2; // resistance every particle will face regardless of anything else

const BOX_HEIGHT = 0.35;
const BOX_WIDTH = 0.9;
const TEXT_POINT_COUNT = 120;

// Sample Text Params
const rectWidth = 0.6;
const rectHeight = 0.2;
const yOffset = 0.0;
const xOffset = 0.0;

const boundingBox = new BoundingBox(stage.scene, BOX_HEIGHT, BOX_WIDTH);

// ---------- FPS COUNTER ----------
let lastTime = performance.now();
let frames = 0;
let fps = 0;

let particles;
let text;

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
    text.updateTextFromScroll(stage.scrollVelocity);
    stage.scrollVelocity *= 0.9; // damping


    // update positions and velocities and lock factor
    particles.setNextPositionVelocityLockFactor(text.textPoints, uTextStrength, dt, emptySpaceResistance);

    // update uTime
    particles.material.uniforms.uTime.value = time * 0.001 * frameRate;

    // render
    stage.renderer.render(stage.scene, stage.camera);
    requestAnimationFrame(animate);
}

(async function(){
    await document.fonts.load('bold 100px Orbitron');
    text = new TextString(stage.scene, 100, 2, movies);
    particles = new Particles(stage.scene, BOX_HEIGHT, BOX_WIDTH, text.textPoints, uTextStrength);
    animate();
})();
