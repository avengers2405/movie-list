import { Init } from "./core/main.js";
import { Particles } from "./components/particles.js";
import { BoundingBox } from "./components/bounding-box.js";
import { RectText } from "./components/rect-text.js";
import { TextString } from "./components/text.js";
import * as THREE from "three";

console.log("JS file loaded");
const movies = ["Orbitron", "Avengers: Infinity War", "The Avengers", "Avengers: Endgame", "Avengers: Age of Ultron", "Captain America: Civil War", "Iron Man", "Iron Man 2", "Iron Man 3", "Spiderman: Homecoming", "Spiderman: Far From Home", "Spiderman: No Way Home"];

const stage = new Init();

const frameRate = 0.5; // 5x speed

let uTextStrength = 0.05; // Increased from 0.0001 for visibility testing
const emptySpaceResistance = 0.4; // resistance every particle will face regardless of anything else

const BOX_HEIGHT = 0.35;
const BOX_WIDTH = 0.9;
const TEXT_POINT_COUNT = 120;

// Sample Text Params
const rectWidth = 0.6;
const rectHeight = 0.2;
const yOffset = 0.0;
const xOffset = 0.0;

const boundingBox = new BoundingBox(stage.scene, BOX_HEIGHT, BOX_WIDTH);

// Debug: Add a test mesh to verify rendering works
const testGeometry = new THREE.CircleGeometry(0.05, 32);
const testMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const testMesh = new THREE.Mesh(testGeometry, testMaterial);
testMesh.position.set(0, 0, 0);
stage.scene.add(testMesh);
console.log("Test mesh added to scene");

// ---------- FPS COUNTER ----------
let lastTime = performance.now();
let frames = 0;
let fps = 0;

let particles;
let text;
let prevTime = 0;

// ---------- ANIMATION LOOP ----------
function animate(time = 0) {
    // frame stats
    frames++;
    const now = performance.now();
    const currentTime = time * 0.001 * frameRate;
    let dt = currentTime - prevTime;
    // Clamp dt to prevent huge jumps when tab loses/regains focus
    dt = Math.min(dt, 1.0 / 60.0); // Cap at ~60fps (16.67ms)
    prevTime = currentTime;
    
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        frames = 0;
        lastTime = now;
        console.log(`FPS: ${fps}`);
    }

    // scroll update
    text.updateTextFromScroll(stage.scrollVelocity);
    stage.scrollVelocity *= 0.9; // damping

    // GPU compute handles all particle updates
    particles.update(dt, currentTime, text.textPoints, uTextStrength);

    // render
    stage.renderer.render(stage.scene, stage.camera);
    requestAnimationFrame(animate);
}

(async function(){
    await document.fonts.load('bold 100px Orbitron');
    text = new TextString(stage.scene, 100, 2, movies);
    particles = new Particles(stage.scene, stage.renderer, BOX_HEIGHT, BOX_WIDTH, text.textPoints, uTextStrength);
    animate();
})();
