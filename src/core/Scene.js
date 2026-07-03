import * as THREE from "three";

export default class Scene3D {
  constructor(container = document.body) {
    this.container = container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(0, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

    container.appendChild(this.renderer.domElement);

    this.#createLights();

    window.addEventListener(
      "resize",
      () => this.resize()
    );
  }

  #createLights() {

    const ambient = new THREE.AmbientLight(
      0xffffff,
      2
    );

    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(
      0xffffff,
      5
    );

    directional.position.set(
      100,
      100,
      200
    );

    this.scene.add(directional);

  }

  resize() {

    const width = window.innerWidth;
const height = window.innerHeight;

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      width,
      height
    );

  }

  render() {

    this.renderer.render(
      this.scene,
      this.camera
    );

  }
  fitCameraToObject(object, offset = 1.25) {

    // Bounding box
    const box = new THREE.Box3().setFromObject(object);

    // Bounding sphere
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const radius = sphere.radius;

    const fov = THREE.MathUtils.degToRad(this.camera.fov);

    const distance = (radius / Math.sin(fov / 2)) * offset;

    this.camera.position.set(
        sphere.center.x,
        sphere.center.y,
        distance
    );

    this.camera.lookAt(sphere.center);

    this.camera.near = Math.max(distance / 100, 0.1);
    this.camera.far = distance * 100;

    this.camera.updateProjectionMatrix();

}
}