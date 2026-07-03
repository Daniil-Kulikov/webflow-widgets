import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import Scene3D from "./core/Scene.js";

const config = {
  svg: "/logo.svg",

  depth: 20,

  color: 0x7B6CF6,

  roughness: 0.35,
  metalness: 0.05,

  rotation: {
    x: 0,
    y: 0,
    z: 0,
  },

  autoRotate: true,
  rotationSpeed: 0.01,

  fitOffset: 1.15,
};

const app = new Scene3D();

const loader = new SVGLoader();

let group = null;

let pivot = null;

loader.load(config.svg, (data) => {

    group = new THREE.Group();

    pivot = new THREE.Group();

    data.paths.forEach((path) => {

        const shapes = path.toShapes(true);

        shapes.forEach((shape) => {

            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: config.depth,
                bevelEnabled: false
            });

            const material = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: config.roughness,
    metalness: config.metalness
});

            const mesh = new THREE.Mesh(
                geometry,
                material
            );

            group.add(mesh);

        });

    });

    group.scale.y *= -1;

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());

    group.position.sub(center);

    group.rotation.set(
    config.rotation.x,
    config.rotation.y,
    config.rotation.z
);

    pivot.add(group);
app.scene.add(pivot);
    app.fitCameraToObject(
    pivot,
    config.fitOffset
);

});

function animate() {

    requestAnimationFrame(animate);

    if (group) {

        if (config.autoRotate) {
    pivot.rotation.y += config.rotationSpeed;
}

    }

    app.render();

}

animate();