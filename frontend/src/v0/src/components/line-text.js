import * as THREE from "three";

export class LineText {
    length;
    xOffset;
    yOffset;

    textPoints;
    geometry = new THREE.BufferGeometry();
    material = new THREE.PointsMaterial({
        color: 0xffffff, // White color
        size: 6,
        transparent: true,
        opacity: 0.2
    });

    text;

    constructor(scene, textPointsCount = 120, length = 0.6, yOffset = 0.0, xOffset = 0.0) {
        this.length = length;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.textPoints = new Float32Array(textPointsCount * 3);

        for (let i = 0; i < textPointsCount; i++) {
            const t = i / (textPointsCount - 1); // 0 to 1
            this.textPoints[i * 3 + 0] = -length / 2 + t * length + xOffset;
            this.textPoints[i * 3 + 1] = yOffset; 
            this.textPoints[i * 3 + 2] = 0;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.textPoints, 3));
        this.text = new THREE.Points(this.geometry, this.material);
        scene.add(this.text);
    }
}