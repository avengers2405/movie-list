import * as THREE from "three";
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import * as glsl from "./../glsl-functions.js";
import vertexShaderSource from "./../shaders/particles.vert?raw";
import fragmentShaderSource from "./../shaders/particles.frag?raw";
import simPositionShader from "./../shaders/simPosition.frag?raw";
import simVelocityShader from "./../shaders/simVelocity.frag?raw";

export class Particles {
    // ---------- PARTICLE COUNT ----------
    PARTICLE_COUNT = 2000;
    MAX_TEXT_POINTS = 10000; // Maximum number of text points supported
    TEXTURE_WIDTH; // GPU compute texture width
    TEXTURE_HEIGHT; // GPU compute texture height

    geometry = new THREE.BufferGeometry();

    gpuCompute;
    velocityVariable;
    positionVariable;
    textPointsTexture;
    
    material;
    particles;
    renderer;

    positions = new Float32Array(this.PARTICLE_COUNT * 3);
    velocities = new Float32Array(this.PARTICLE_COUNT * 3);
    seeds = new Float32Array(this.PARTICLE_COUNT);
    lockFactor = new Float32Array(this.PARTICLE_COUNT); // 0 → free, 1 → locked to text
    textStickyness = 0.8;

    constructor(scene, renderer, BOX_HEIGHT, BOX_WIDTH, textPoints, uTextStrength) {
        this.renderer = renderer;
        
        // Calculate GPU compute texture dimensions
        this.TEXTURE_WIDTH = Math.ceil(Math.sqrt(this.PARTICLE_COUNT));
        this.TEXTURE_HEIGHT = Math.ceil(this.PARTICLE_COUNT / this.TEXTURE_WIDTH);

        // 1. Setup GPU Computation Renderer
        this.gpuCompute = new GPUComputationRenderer(this.TEXTURE_WIDTH, this.TEXTURE_HEIGHT, renderer);

        // 2. Create Initial State Textures
        const dtPosition = this.gpuCompute.createTexture();
        const dtVelocity = this.gpuCompute.createTexture();
        this.fillInitialTexture(dtPosition, dtVelocity, BOX_WIDTH, BOX_HEIGHT);

        // 3. Add Variables (The "Ping-Pong" buffers)
        this.velocityVariable = this.gpuCompute.addVariable("textureVelocity", simVelocityShader, dtVelocity);
        this.positionVariable = this.gpuCompute.addVariable("texturePosition", simPositionShader, dtPosition);

        // 4. Dependencies (Velocity needs Position, Position needs Velocity)
        this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);

        // 5. Create Text Data Texture
        this.textPointsTexture = new THREE.DataTexture(
            new Float32Array(this.MAX_TEXT_POINTS * 4), // RGBA
            this.MAX_TEXT_POINTS, 
            1, 
            THREE.RGBAFormat, 
            THREE.FloatType
        );
        this.textPointsTexture.minFilter = THREE.NearestFilter;
        this.textPointsTexture.magFilter = THREE.NearestFilter;
        this.textPointsTexture.needsUpdate = true;

        // 6. Set Uniforms for Sim Shaders
        const velUniforms = this.velocityVariable.material.uniforms;
        velUniforms["uTime"] = { value: 0 };
        velUniforms["uDelta"] = { value: 0 };
        velUniforms["uTextStrength"] = { value: uTextStrength };
        velUniforms["uResistance"] = { value: 0.4 }; // from your main.js
        velUniforms["textureText"] = { value: this.textPointsTexture };
        velUniforms["uTextPointCount"] = { value: textPoints.length / 3 };
        velUniforms["uMaxTextPoints"] = { value: this.MAX_TEXT_POINTS };
        
        this.updateTextTexture(textPoints); // Populate it (after uniforms are initialized)

        const posUniforms = this.positionVariable.material.uniforms;
        posUniforms["uDelta"] = { value: 0 };

        // 7. Initialize
        const error = this.gpuCompute.init();
        if (error !== null) console.error(error);

        // 7.5. Run initial compute to populate render targets
        this.gpuCompute.compute();

        // 8. Create Render Geometry (The Visuals)
        this.initRenderGeometry(scene, BOX_WIDTH, BOX_HEIGHT);

        console.log("Particles initialized:", {
            particleCount: this.PARTICLE_COUNT,
            textureSize: `${this.TEXTURE_WIDTH}x${this.TEXTURE_HEIGHT}`,
            referencesCount: this.geometry.attributes.reference.count
        });

        // // Initialize particles randomly inside box
        // for (let i = 0; i < this.PARTICLE_COUNT; i++) {
        //     this.positions[i * 3 + 0] = (Math.random() - 0.5) * (BOX_WIDTH * 0.9);
        //     this.positions[i * 3 + 1] = (Math.random() - 0.5) * (BOX_HEIGHT * 0.9);
        //     this.positions[i * 3 + 2] = 0;
        //     this.velocities[i * 3 + 0] = 0;
        //     this.velocities[i * 3 + 1] = 0;
        //     this.velocities[i * 3 + 2] = 0;
        //     this.seeds[i] = Math.random();
        //     this.lockFactor[i] = 0.0;
        // }

        // console.log("Positions: ", this.positions);
        // console.log("Seeds: ", this.seeds);

        // this.geometry.setAttribute(
        //     "position",
        //     new THREE.BufferAttribute(this.positions, 3)
        // );
        // this.geometry.setAttribute(
        //     "seed",
        //     new THREE.BufferAttribute(this.seeds, 1)
        // );
        // this.geometry.setAttribute(
        //     "lockFactor",
        //     new THREE.BufferAttribute(this.lockFactor, 1)
        // );

        // this.calcLockFactor(textPoints, uTextStrength);

        // this.material = new THREE.ShaderMaterial({
        //     vertexShader: vertexShaderSource,
        //     fragmentShader: fragmentShaderSource,
        //     uniforms: {
        //         uTime: { value: 0 },
        //         uBoxSize: { value: new THREE.Vector2(BOX_WIDTH, BOX_HEIGHT) },
        //     },
        //     transparent: true,
        //     blending: THREE.AdditiveBlending
        // });

        // // ---------- POINTS ----------
        // this.particles = new THREE.Points(this.geometry, this.material);

        // scene.add(this.particles);
    }

    fillInitialTexture(texturePos, textureVel, w, h) {
        const posArray = texturePos.image.data;
        const velArray = textureVel.image.data;

        for (let i = 0; i < posArray.length; i += 4) {
            // Random Pos
            posArray[i + 0] = (Math.random() - 0.5) * w;
            posArray[i + 1] = (Math.random() - 0.5) * h;
            posArray[i + 2] = 0;
            posArray[i + 3] = Math.random(); // seed in Alpha

            // Zero Velocity
            velArray[i + 0] = 0;
            velArray[i + 1] = 0;
            velArray[i + 2] = 0;
            velArray[i + 3] = 0;
        }
    }

    updateTextTexture(textPoints) {
        const data = this.textPointsTexture.image.data;
        const count = Math.min(textPoints.length / 3, this.MAX_TEXT_POINTS);
        
        // Reset
        data.fill(0);

        for(let i = 0; i < count; i++) {
            data[i*4 + 0] = textPoints[i*3 + 0]; // x
            data[i*4 + 1] = textPoints[i*3 + 1]; // y
            data[i*4 + 2] = textPoints[i*3 + 2]; // z
            data[i*4 + 3] = 1.0; // valid flag
        }
        this.textPointsTexture.needsUpdate = true;
        
        // Update uniform count
        if(this.velocityVariable) {
            this.velocityVariable.material.uniforms["uTextPointCount"].value = count;
        }
    }

    initRenderGeometry(scene, BOX_WIDTH, BOX_HEIGHT) {
        this.geometry = new THREE.BufferGeometry();
        
        // We need UVs reference for every particle to look up its own position in the FBO
        const references = new Float32Array(this.PARTICLE_COUNT * 2);
        const positions = new Float32Array(this.PARTICLE_COUNT * 3); // Dummy positions
        
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            // Use texel centers for accurate texture lookup
            const x = (i % this.TEXTURE_WIDTH + 0.5) / this.TEXTURE_WIDTH;
            const y = (Math.floor(i / this.TEXTURE_WIDTH) + 0.5) / this.TEXTURE_HEIGHT;
            references[i * 2 + 0] = x;
            references[i * 2 + 1] = y;
            
            // Set dummy positions (required by Three.js for Points)
            positions[i * 3 + 0] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));
        
        // DEBUG: Create a test particle system with basic material
        const testGeometry = new THREE.BufferGeometry();
        const testPositions = new Float32Array(100 * 3);
        for (let i = 0; i < 100; i++) {
            testPositions[i * 3 + 0] = (Math.random() - 0.5) * 0.5;
            testPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            testPositions[i * 3 + 2] = 0;
        }
        testGeometry.setAttribute('position', new THREE.BufferAttribute(testPositions, 3));
        const testMaterial = new THREE.PointsMaterial({ 
            color: 0xff0000, 
            size: 0.02,
            sizeAttenuation: false
        });
        const testParticles = new THREE.Points(testGeometry, testMaterial);
        scene.add(testParticles);
        console.log("Test particles (red) added with basic material");
        
        // Note: we don't need 'position' attribute anymore, the vertex shader will fetch it!

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                texturePosition: { value: this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture },
                textureVelocity: { value: this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture },
                uBoxSize: { value: new THREE.Vector2(BOX_WIDTH, BOX_HEIGHT) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Check for shader errors
        this.material.onBeforeCompile = (shader) => {
            console.log("Particle shader compiled successfully");
        };

        this.particles = new THREE.Points(this.geometry, this.material);
        this.particles.frustumCulled = false; // Disable frustum culling for debugging
        scene.add(this.particles);
        
        console.log("Points object added to scene:", {
            particleCount: this.geometry.attributes.position.count,
            visible: this.particles.visible,
            material: this.material.type
        });
    }

    update(dt, time, textPoints, uTextStrength) {
        // 1. Update Uniforms
        this.velocityVariable.material.uniforms["uDelta"].value = dt;
        this.velocityVariable.material.uniforms["uTime"].value = time;
        this.velocityVariable.material.uniforms["uTextStrength"].value = uTextStrength;
        
        this.positionVariable.material.uniforms["uDelta"].value = dt;

        // 2. If text points changed (handled externally or checked here), update texture
        // (Optimally call this.updateTextTexture only when text actually changes)
        this.updateTextTexture(textPoints);

        // 3. Compute
        this.gpuCompute.compute();

        // 4. Update Render Material with new Position Texture
        this.material.uniforms["texturePosition"].value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        this.material.uniforms["textureVelocity"].value = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
        
        // Debug: Log once every 60 frames
        if (Math.floor(time) % 5 === 0 && dt > 0) {
            console.log("Particle update:", {
                dt: dt.toFixed(4),
                textPointCount: textPoints.length / 3,
                uTextStrength,
                particleVisible: this.particles.visible
            });
        }
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

            let textStuck = false;
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
                    textStuck = true;
                }
            }

            if (textStuck) {
                this.velocities[i*3 + 0] = 0;
                this.velocities[i*3 + 1] = 0;
                this.velocities[i*3 + 2] = 0;
                continue;
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