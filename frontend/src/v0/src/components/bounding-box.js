import * as THREE from "three";

export class BoundingBox {
    height = 0.35;
    width = 0.9;
    borderPoints;

    geometry = new THREE.BufferGeometry();
    material = new THREE.LineBasicMaterial({
        color: 0xff0000, // Red color
        linewidth: 2 // Note: linewidth only works on certain platforms
    });

    borderLines;

    constructor(scene, BOX_HEIGHT, BOX_WIDTH) {
        this.height = BOX_HEIGHT;
        this.width = BOX_WIDTH;

        this.borderPoints = new Float32Array([
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

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.borderPoints, 3));

        this.borderLines = new THREE.LineSegments(this.geometry, this.material);
        scene.add(this.borderLines);
    }
}