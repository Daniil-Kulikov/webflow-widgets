import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import BaseObject from "../core/BaseObject.js";
import MaterialFactory from "../materials/MaterialFactory.js";

const DEFAULT_OPTIONS = Object.freeze({
  svg: "",
  depth: 20,
  color: 0x7B6CF6,
  roughness: 0.35,
  metalness: 0.05,
  rotation: Object.freeze({
    x: 0,
    y: 0,
    z: 0,
  }),
  autoRotate: true,
  rotationSpeed: 0.01,
  fitOffset: 1.15,
});

/**
 * Loads an SVG and turns it into an extruded, interactive 3D object.
 */
export default class Extrude extends BaseObject {
  /**
   * Creates an SVG extrusion object.
   *
   * @param {import("../core/RendererContext.js").default} context - Rendering context for the object.
   * @param {object} options - Extrusion options.
   * @param {string} options.svg - URL of the SVG file to load.
   * @param {number} options.depth - Extrusion depth.
   * @param {THREE.ColorRepresentation} options.color - Material color.
   * @param {number} options.roughness - Material roughness.
   * @param {number} options.metalness - Material metalness.
   * @param {{x: number, y: number, z: number}} options.rotation - Initial object rotation.
   * @param {boolean} options.autoRotate - Whether the object rotates every frame.
   * @param {number} options.rotationSpeed - Y-axis rotation speed per frame.
   * @param {number} options.fitOffset - Camera fitting distance multiplier.
   */
  constructor(context, options = {}) {
    const settings = Extrude.#createOptions(options);

    super(context, settings);

    this.options = settings;
    this._svg = settings.svg;
    this._depth = settings.depth;
    this._color = settings.color;
    this._roughness = settings.roughness;
    this._metalness = settings.metalness;
    this._autoRotate = settings.autoRotate;
    this._rotationSpeed = settings.rotationSpeed;
    this._fitOffset = settings.fitOffset;
    this._geometryDirty = false;
    this._materialDirty = false;

    this.loader = new SVGLoader();
    this.group = new THREE.Group();
    this.pivot = new THREE.Group();
    this.material = null;
    this.shapes = [];
    this.object = this.pivot;

    this.rotation.set(
      settings.rotation.x,
      settings.rotation.y,
      settings.rotation.z
    );
  }

  /**
   * Loads the configured SVG, builds geometry, and fits the viewport camera.
   *
   * @returns {Promise<void>} Resolves when object-specific initialization is complete.
   */
  async onInit() {
    const data = await this.#loadSvg();

    this.#buildFromSvg(data);
    this.#fitCameraToObject(this.pivot, this._fitOffset);
    this._geometryDirty = false;
    this._materialDirty = false;
  }

  /**
   * Loads the configured SVG.
   *
   * This method is kept as a compatibility alias for earlier FlowFX usage.
   *
   * @returns {Promise<Extrude>} Resolves with this instance after the SVG is ready.
   */
  load() {
    return this.init();
  }

  /**
   * Advances the object animation by one frame after the base lifecycle permits updates.
   *
   * @returns {void}
   */
  onUpdate() {
    if (this._geometryDirty) {
      this.#rebuildGeometry();
      this.#centerGroup();
      this.#fitCameraToObject(this.pivot, this._fitOffset);
      this._geometryDirty = false;
    }

    if (this._materialDirty) {
      this.#updateMaterial();
      this._materialDirty = false;
    }

    if (this._autoRotate) {
      this.pivot.rotation.y += this._rotationSpeed;
    }
  }

  /**
   * Releases geometry and material resources during destruction.
   *
   * @returns {void}
   */
  onDestroy() {
    this.#disposeObject(this.group);
    this.group.clear();
    this.pivot.clear();
  }

  /**
   * Gets the animated pivot rotation.
   *
   * @returns {THREE.Euler} The pivot rotation.
   */
  get rotation() {
    return this.pivot.rotation;
  }

  /**
   * Sets the animated pivot rotation.
   *
   * @param {THREE.Euler | {x?: number, y?: number, z?: number}} value - New rotation.
   */
  set rotation(value) {
    this.#copyVectorLike(this.pivot.rotation, value);
  }

  /**
   * Gets the object position.
   *
   * @returns {THREE.Vector3} The object position.
   */
  get position() {
    return this.pivot.position;
  }

  /**
   * Sets the object position.
   *
   * @param {THREE.Vector3 | {x?: number, y?: number, z?: number}} value - New position.
   */
  set position(value) {
    this.#copyVectorLike(this.pivot.position, value);
  }

  /**
   * Gets the object scale.
   *
   * @returns {THREE.Vector3} The object scale.
   */
  get scale() {
    return this.pivot.scale;
  }

  /**
   * Sets the object scale.
   *
   * @param {THREE.Vector3 | {x?: number, y?: number, z?: number}} value - New scale.
   */
  set scale(value) {
    this.#copyVectorLike(this.pivot.scale, value);
  }

  /**
   * Gets the current extrusion depth.
   *
   * @returns {number} The extrusion depth.
   */
  get depth() {
    return this._depth;
  }

  /**
   * Sets the extrusion depth.
   *
   * @param {number} value - New extrusion depth.
   */
  set depth(value) {
    if (value === this._depth) {
      return;
    }

    this._depth = value;
    this._geometryDirty = true;
  }

  /**
   * Gets the material color.
   *
   * @returns {THREE.ColorRepresentation} The material color.
   */
  get color() {
    return this._color;
  }

  /**
   * Sets the material color.
   *
   * @param {THREE.ColorRepresentation} value - New material color.
   */
  set color(value) {
    this._color = value;
    this._materialDirty = true;
  }

  /**
   * Gets the material roughness.
   *
   * @returns {number} The material roughness.
   */
  get roughness() {
    return this._roughness;
  }

  /**
   * Sets the material roughness.
   *
   * @param {number} value - New material roughness.
   */
  set roughness(value) {
    if (value === this._roughness) {
      return;
    }

    this._roughness = value;
    this._materialDirty = true;
  }

  /**
   * Gets the material metalness.
   *
   * @returns {number} The material metalness.
   */
  get metalness() {
    return this._metalness;
  }

  /**
   * Sets the material metalness.
   *
   * @param {number} value - New material metalness.
   */
  set metalness(value) {
    if (value === this._metalness) {
      return;
    }

    this._metalness = value;
    this._materialDirty = true;
  }

  /**
   * Gets whether the object rotates every frame.
   *
   * @returns {boolean} Whether automatic rotation is enabled.
   */
  get autoRotate() {
    return this._autoRotate;
  }

  /**
   * Sets whether the object rotates every frame.
   *
   * @param {boolean} value - Whether automatic rotation is enabled.
   */
  set autoRotate(value) {
    this._autoRotate = value;
  }

  /**
   * Gets the Y-axis rotation speed per frame.
   *
   * @returns {number} The rotation speed.
   */
  get rotationSpeed() {
    return this._rotationSpeed;
  }

  /**
   * Sets the Y-axis rotation speed per frame.
   *
   * @param {number} value - New rotation speed.
   */
  set rotationSpeed(value) {
    this._rotationSpeed = value;
  }

  #buildFromSvg(data) {
    this.#assertSvgData(data);
    this.shapes = this.#createShapes(data.paths);
    this.material = this.#createMaterial();
    this.#createMeshes();
    this.#centerGroup();
    this.pivot.add(this.group);
  }

  #createShapes(paths) {
    return paths.flatMap((path) => path.toShapes(true));
  }

  #createMeshes() {
    this.shapes.forEach((shape) => {
      this.group.add(this.#createMesh(shape));
    });
  }

  #createMesh(shape) {
    const mesh = new THREE.Mesh(this.#createGeometry(shape), this.material);

    mesh.userData.flowfxShape = shape;

    return mesh;
  }

  #createGeometry(shape) {
    return new THREE.ExtrudeGeometry(shape, {
      depth: this._depth,
      bevelEnabled: false,
    });
  }

  #createMaterial() {
    return MaterialFactory.createStandardMaterial({
      color: this._color,
      roughness: this._roughness,
      metalness: this._metalness,
    });
  }

  #rebuildGeometry() {
    this.#getMeshes().forEach((mesh) => {
      const shape = mesh.userData.flowfxShape;
      const geometry = this.#createGeometry(shape);
      const previousGeometry = mesh.geometry;

      mesh.geometry = geometry;
      previousGeometry?.dispose();
    });
  }

  #updateMaterial() {
    if (!this.material) {
      return;
    }

    this.material.color.set(this._color);
    this.material.roughness = this._roughness;
    this.material.metalness = this._metalness;
    this.material.needsUpdate = true;
  }

  #centerGroup() {
    this.group.scale.y = -Math.abs(this.group.scale.y);
    this.group.position.set(0, 0, 0);

    const box = this.#getGeometryBox();
    const center = box.getCenter(new THREE.Vector3());

    this.group.position.set(
      -center.x * this.group.scale.x,
      -center.y * this.group.scale.y,
      -center.z * this.group.scale.z
    );
  }

  #fitCameraToObject(object, offset) {
    const box = new THREE.Box3().setFromObject(object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const camera = this.context.camera;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = (sphere.radius / Math.sin(fov / 2)) * offset;

    camera.position.set(
      sphere.center.x,
      sphere.center.y,
      distance
    );

    camera.lookAt(sphere.center);
    camera.near = Math.max(distance / 100, 0.1);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
  }

  #disposeObject(object) {
    const materials = new Set();

    object.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.geometry?.dispose();
      this.#collectMaterials(child.material, materials);
    });

    materials.forEach((material) => material.dispose());
  }

  #collectMaterials(material, materials) {
    if (Array.isArray(material)) {
      material.forEach((item) => materials.add(item));
      return;
    }

    if (material) {
      materials.add(material);
    }
  }

  #getMeshes() {
    return this.group.children.filter((child) => child.isMesh);
  }

  #getGeometryBox() {
    const box = new THREE.Box3();

    this.#getMeshes().forEach((mesh) => {
      mesh.geometry.computeBoundingBox();
      box.union(mesh.geometry.boundingBox);
    });

    return box;
  }

  #copyVectorLike(target, value) {
    if (!value) {
      return;
    }

    if (typeof value.x === "number") {
      target.x = value.x;
    }

    if (typeof value.y === "number") {
      target.y = value.y;
    }

    if (typeof value.z === "number") {
      target.z = value.z;
    }
  }

  #loadSvg() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        this._svg,
        resolve,
        undefined,
        reject
      );
    });
  }

  static #createOptions(options) {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
      rotation: {
        ...DEFAULT_OPTIONS.rotation,
        ...options.rotation,
      },
    };
  }

  #assertSvgData(data) {
    if (!data?.paths?.length) {
      throw new Error("FlowFX Extrude could not generate geometry from an empty SVG.");
    }
  }
}
