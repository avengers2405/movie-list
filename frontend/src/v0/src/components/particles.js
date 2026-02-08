import * as THREE from "three";
import * as glsl from "./../glsl-functions.js";
import vertexShaderSource from "./../shaders/particles.vert?raw";
import fragmentShaderSource from "./../shaders/particles.frag?raw";

export class Particles {
    // ---------- PARTICLE COUNT ----------
    PARTICLE_COUNT = 500;

    geometry = new THREE.BufferGeometry();
    
    material;
    particles;

    positions = new Float32Array(this.PARTICLE_COUNT * 3);
    velocities = new Float32Array(this.PARTICLE_COUNT * 3);
    seeds = new Float32Array(this.PARTICLE_COUNT);
    lockFactor = new Float32Array(this.PARTICLE_COUNT); // 0 → free, 1 → locked to text

    constructor(scene, BOX_HEIGHT, BOX_WIDTH, textPoints, uTextStrength) {
        // Initialize particles randomly inside box
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            this.positions[i * 3 + 0] = (Math.random() - 0.5) * (BOX_WIDTH * 0.9);
            this.positions[i * 3 + 1] = (Math.random() - 0.5) * (BOX_HEIGHT * 0.9);
            this.positions[i * 3 + 2] = 0;
            this.velocities[i * 3 + 0] = 0;
            this.velocities[i * 3 + 1] = 0;
            this.velocities[i * 3 + 2] = 0;
            this.seeds[i] = Math.random();
            this.lockFactor[i] = 0.0;
        }

        console.log("Positions: ", this.positions);
        console.log("Seeds: ", this.seeds);

        this.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(this.positions, 3)
        );
        this.geometry.setAttribute(
            "seed",
            new THREE.BufferAttribute(this.seeds, 1)
        );
        this.geometry.setAttribute(
            "lockFactor",
            new THREE.BufferAttribute(this.lockFactor, 1)
        );

        this.calcLockFactor(textPoints, uTextStrength);

        this.material = new THREE.ShaderMaterial({
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
        this.particles = new THREE.Points(this.geometry, this.material);

        scene.add(this.particles);
    }

    // initialise lock factor
    lockPower(x, uTextStrength){
        // returns power of lock between text point and particle if they are at a distance 'x'
        return 1.0 - glsl.smoothstep(0.0, uTextStrength, x);
    }

    calcLockFactor(textPoints, uTextStrength){
        const TEXT_POINT_COUNT = textPoints.length / 3;
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            let factor = 0.0;
            for (let j = 0; j < TEXT_POINT_COUNT; j++) {
                let distance = glsl.distance(
                    this.positions[i * 3 + 0], this.positions[i * 3 + 1],
                    textPoints[j * 3 + 0], textPoints[j * 3 + 1]
                );

                factor += (1 - factor) * (this.lockPower(distance, uTextStrength));
                factor = glsl.clamp(factor, 0.0, 1.0);
            }
            this.lockFactor[i] = factor;
        }
        this.geometry.attributes.lockFactor.needsUpdate = true;
    }

    setNextPositionVelocityLockFactor(textPoints, uTextStrength, dt, emptySpaceResistance) {
        const TEXT_POINT_COUNT = textPoints.length / 3;
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const xi = this.positions[i*3];
            const yi = this.positions[i*3 + 1];

            const vxi = this.velocities[i*3];
            const vyi = this.velocities[i*3 + 1];

            // let force (attracion) be const for now
            let ax = 0.0;
            let ay = 0.0;

            for (let j = 0; j < TEXT_POINT_COUNT; j++) {
                let tx = textPoints[j*3 + 0];
                let ty = textPoints[j*3 + 1];

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

            this.positions[i*3] = xi + vxi * dt + 0.5 * ax * dt * dt;
            this.positions[i*3 + 1] = yi + vyi * dt + 0.5 * ay * dt * dt;
            this.positions[i*3 + 2] = 0;

            this.velocities[i*3] = (vxi + ax * dt)*(1-emptySpaceResistance);
            this.velocities[i*3 + 1] = (vyi + ay * dt)*(1-emptySpaceResistance);
            this.velocities[i*3 + 2] = 0;
        }
        this.geometry.attributes.position.needsUpdate = true;

        this.calcLockFactor(textPoints, uTextStrength);
    }
}