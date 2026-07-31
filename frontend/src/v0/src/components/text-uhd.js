import * as THREE from 'three';

export class TextUHD{
    movies;
    currentMovie;
    scrollIndex = 0;
    textPoints;
    geometry = new THREE.BufferGeometry();
    material = new THREE.PointsMaterial({
        color: 0xffffff, // White color
        size: 1,
        transparent: true,
        opacity: 0.75
    });
    text;
    size;

    constructor(scene, size, movies, scrollIndex = 0) {
        this.movies = movies;
        this.currentMovie = this.movies[0].toUpperCase();
        this.scrollIndex = scrollIndex;
        this.size = size;

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
        console.log("Setting text points for movie: ", this.currentMovie);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // 1. Setup Font (Orbitron is a great 'Modern/Tech' choice)
        ctx.font = `bold ${this.size}px "Orbitron", "Inter", sans-serif`;
        
        // 2. Measure text to size the canvas correctly
        const metrics = ctx.measureText(this.currentMovie);
        canvas.width = metrics.width;
        canvas.height = this.size * 1.5; // Padding for descenders

        console.log("Canvas size: ", canvas.width, "x", canvas.height, "pixels: ", canvas.width * canvas.height, "flat array reqd for this: ", canvas.width * canvas.height * 3);
        
        // 3. Draw text
        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${this.size}px "Orbitron", "Inter", sans-serif`;
        ctx.fillText(this.currentMovie, 0, canvas.height / 2);

        // 4. Scan pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        this.textPoints = new Float32Array(imageData.length / 4 * 3); // 3 coordinates per pixel
        for (let i = 0; i < imageData.length; i += 4) {
            this.textPoints[(i / 4) * 3] = 255;//imageData[(i/4)*3]; //(i / 4) % canvas.width;
            this.textPoints[(i / 4) * 3 + 1] = 255; //imageData[(i/4)*3+1]; //Math.floor((i / 4) / canvas.width);
            this.textPoints[(i / 4) * 3 + 2] = 255;//imageData[(i/4)*3+2]; // imageData[i + 3] / 255; // Alpha channel
        }
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