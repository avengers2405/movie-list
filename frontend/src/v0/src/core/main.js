import * as THREE from "three";

export class Init {
    scrollVelocity = 0;
    scene;
    camera;
    renderer;
    touchStartY = 0;
    touchStartTime = 0;

    constructor(){
        // ---------- BASIC SETUP ----------
        this.scene = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            -aspect, aspect, 1, -1, 0.1, 10
        );
        this.camera.position.z = 1;

        // Desktop scroll
        window.addEventListener("wheel", (e) => {
            this.scrollVelocity += e.deltaY * 0.0005;
            // console.log("Scroll Velocity: ", this.scrollVelocity);
        });

        // Mobile touch events
        window.addEventListener("touchstart", (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            const touchY = e.touches[0].clientY;
            const deltaY = this.touchStartY - touchY;
            const deltaTime = Date.now() - this.touchStartTime;
            
            // Calculate velocity based on swipe speed
            const velocity = deltaY / Math.max(deltaTime, 1);
            this.scrollVelocity += velocity * 0.05;
            
            this.touchStartY = touchY;
            this.touchStartTime = Date.now();
        }, { passive: true });

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // ---------- RESIZE ----------
        window.addEventListener("resize", () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = -aspect;
            this.camera.right = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}