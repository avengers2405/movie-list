import * as THREE from "three";

export function init() {
    // ---------- BASIC SETUP ----------
    const scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
        -aspect, aspect, 1, -1, 0.1, 10
    );
    camera.position.z = 1;

    window.addEventListener("wheel", (e) => {
        scrollVelocity += e.deltaY * 0.0005;
    });

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ---------- RESIZE ----------
    window.addEventListener("resize", () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -aspect;
        camera.right = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer };
}