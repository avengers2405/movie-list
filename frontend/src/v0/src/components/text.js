import * as THREE from 'three';

export class TextString {
    movies;
    currentMovie;
    scrollIndex = 0;
    textPoints;
    geometry = new THREE.BufferGeometry();
    material = new THREE.PointsMaterial({
        color: 0xffffff, // White color
        size: 1,
        transparent: true,
        opacity: 0.0
    });
    text;
    size;
    spacing;

    constructor(scene, size, spacing, movies, scrollIndex = 0) {
        this.movies = movies;
        this.currentMovie = this.movies[0].toUpperCase();
        this.scrollIndex = scrollIndex;
        this.size = size;
        this.spacing = spacing;

        this.setTextPoints();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.textPoints, 3));
        this.text = new THREE.Points(this.geometry, this.material);
        scene.add(this.text);
    }

    /**
     * Extracts 3D points from a string of text.
     * @param {string} text - The text to turn into points.
     * @param {number} size - Font size (px).
     * @param {number} spacing - Sampling density (higher = fewer points).
     */
    setTextPoints() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // 1. Setup Font (Orbitron is a great 'Modern/Tech' choice)
        ctx.font = `bold ${this.size}px "Orbitron", "Inter", sans-serif`;
        
        // 2. Measure text to size the canvas correctly
        const metrics = ctx.measureText(this.currentMovie);
        canvas.width = metrics.width;
        canvas.height = this.size * 1.5; // Padding for descenders

        // 3. Draw text
        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${this.size}px "Orbitron", "Inter", sans-serif`;
        ctx.fillText(this.currentMovie, 0, canvas.height / 2);

        // 4. Scan pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const points = [];

        // Jump by 'spacing' to control particle density
        for (let y = 0; y < canvas.height; y += this.spacing) {
            for (let x = 0; x < canvas.width; x += this.spacing) {
                // ImageData is [R, G, B, A, R, G, B, A...]
                // We only care if Alpha (the 4th value) is > 128 (visible)
                const alpha = imageData[(y * canvas.width + x) * 4 + 3];
                
                if (alpha > 128) {
                    points.push({
                        x: x - canvas.width / 2, // Center the points
                        y: (canvas.height / 2 - y), // Flip Y for WebGL coords
                        z: 0
                    });
                }
            }
        }
        console.log("Points: ", points);
        this.textPoints = new Float32Array(points.flatMap(p => [p.x/800.0, p.y/800.0, p.z/800.0]));
    }

    updateTextSizeSpacing(size = this.size, spacing = this.spacing) {
        this.size = size;
        this.spacing = spacing;
    }

    updateTextFromScroll(scrollVelocity) {
        if (Math.abs(scrollVelocity) > 0.01) {
            console.log("New scroll Index: ", (this.scrollIndex + scrollVelocity + this.movies.length) % this.movies.length);
        }

        if (Math.floor((this.scrollIndex + scrollVelocity + this.movies.length) % this.movies.length) == Math.floor(this.scrollIndex)){
            this.scrollIndex = (this.scrollIndex + scrollVelocity + this.movies.length) % this.movies.length;
            return; // no change in movie, skip update
        }
        this.scrollIndex = (this.scrollIndex + scrollVelocity + this.movies.length) % this.movies.length;
        this.currentMovie = this.movies[Math.floor(this.scrollIndex)].toUpperCase();
        this.setTextPoints();
        
        // Update the buffer attribute with the new data
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.textPoints, 3));
    
    }
}

// Usage Example:
// const particleTargets = getTextPoints("NANO-SUIT", 120, 2);
// console.log(`Generated ${particleTargets.length} target points.`);