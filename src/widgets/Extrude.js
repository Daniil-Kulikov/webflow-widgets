import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export default class Extrude {

    constructor(app, config) {

        this.app = app;
        this.config = config;

        this.loader = new SVGLoader();

        this.group = null;
        this.pivot = null;

    }

    load() {

        this.loader.load(this.config.svg, (data) => {

            this.group = new THREE.Group();
            this.pivot = new THREE.Group();

            data.paths.forEach((path) => {

                const shapes = path.toShapes(true);

                shapes.forEach((shape) => {

                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: this.config.depth,
                        bevelEnabled: false
                    });

                    const material = new THREE.MeshStandardMaterial({
                        color: this.config.color,
                        roughness: this.config.roughness,
                        metalness: this.config.metalness
                    });

                    const mesh = new THREE.Mesh(
                        geometry,
                        material
                    );

                    this.group.add(mesh);

                });

            });

            this.group.scale.y *= -1;

            const box = new THREE.Box3().setFromObject(this.group);
            const center = box.getCenter(new THREE.Vector3());

            this.group.position.sub(center);

            this.group.rotation.set(
                this.config.rotation.x,
                this.config.rotation.y,
                this.config.rotation.z
            );

            this.pivot.add(this.group);

            this.app.scene.add(this.pivot);

            this.app.fitCameraToObject(
                this.pivot,
                this.config.fitOffset
            );

        });

    }

    update() {

        if (!this.pivot) return;

        if (this.config.autoRotate) {

            this.pivot.rotation.y +=
                this.config.rotationSpeed;

        }

    }

}