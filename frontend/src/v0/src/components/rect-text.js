import * as THREE from "three";

export class RectText {
    height;
    width;
    textPoints;

    geometry = new THREE.BufferGeometry();
    material = new THREE.PointsMaterial({
        color: 0xffffff, // White color
        size: 6,
        transparent: true,
        opacity: 0.2
    });

    text;

    constructor(scene, textPointsCount = 120, height = 0.2, width = 0.6, yOffset = 0.0, xOffset = 0.0) {
        this.width = width;
        this.height = height;
        this.textPoints = new Float32Array(textPointsCount * 3);

        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const perimeter = 2 * (width + height);

        for (let i = 0; i < textPointsCount; i++) {
            const t = (i / textPointsCount) * perimeter; // Distance along perimeter
            
            if (t < width) {
                // Bottom edge: left to right
                this.textPoints[i * 3 + 0] = -halfWidth + t + xOffset;
                this.textPoints[i * 3 + 1] = -halfHeight + yOffset;
                this.textPoints[i * 3 + 2] = 0;
            } else if (t < width + height) {
                // Right edge: bottom to top
                this.textPoints[i * 3 + 0] = halfWidth + xOffset;
                this.textPoints[i * 3 + 1] = -halfHeight + (t - width) + yOffset;
                this.textPoints[i * 3 + 2] = 0;
            } else if (t < 2 * width + height) {
                // Top edge: right to left
                this.textPoints[i * 3 + 0] = halfWidth - (t - width - height) + xOffset;
                this.textPoints[i * 3 + 1] = halfHeight + yOffset;
                this.textPoints[i * 3 + 2] = 0;
            } else {
                // Left edge: top to bottom
                this.textPoints[i * 3 + 0] = -halfWidth + xOffset;
                this.textPoints[i * 3 + 1] = halfHeight - (t - 2 * width - height) + yOffset;
                this.textPoints[i * 3 + 2] = 0;
            }
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.textPoints, 3));
        this.text = new THREE.Points(this.geometry, this.material);
        scene.add(this.text);
    }
}