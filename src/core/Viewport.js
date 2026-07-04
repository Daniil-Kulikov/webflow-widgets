import * as THREE from "three";
import RendererContext from "./RendererContext.js";

const DEFAULT_OPTIONS = Object.freeze({
  container: null,
  alpha: true,
  antialias: true,
  fov: 45,
  near: 0.1,
  far: 1000,
  cameraZ: 300,
  pixelRatio: null,
  background: null,
});

/**
 * Owns the Three.js rendering viewport for FlowFX.
 *
 * The viewport is intentionally limited to scene, camera, renderer, lights,
 * resize, and render responsibilities. Object behavior belongs in object
 * classes, not here.
 */
export default class Viewport {
  #resizeHandler;
  #context;

  /**
   * Creates a rendering viewport.
   *
   * @param {object} options - Viewport options.
   * @param {HTMLElement | null} options.container - Element that receives the renderer canvas.
   * @param {boolean} options.alpha - Whether the renderer canvas supports transparency.
   * @param {boolean} options.antialias - Whether the renderer uses antialiasing.
   * @param {number} options.fov - Perspective camera field of view in degrees.
   * @param {number} options.near - Perspective camera near clipping plane.
   * @param {number} options.far - Perspective camera far clipping plane.
   * @param {number} options.cameraZ - Initial camera position on the Z axis.
   * @param {number | null} options.pixelRatio - Renderer pixel ratio. Defaults to the device pixel ratio.
   * @param {THREE.ColorRepresentation | null} options.background - Optional scene background color.
   */
  constructor(options = {}) {
    const settings = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.container = this.#resolveContainer(settings.container);

    const scene = this.#createScene(settings.background);
    const camera = this.#createCamera(settings);
    const renderer = this.#createRenderer(settings);

    this.#context = new RendererContext({
      scene,
      camera,
      renderer,
    });

    this.lights = this.#createLights();

    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);

    this.#context.scene.add(...this.lights);
    this.container.appendChild(this.#context.renderer.domElement);

    this.#resizeHandler = this.resize;
    this.#getWindow().addEventListener("resize", this.#resizeHandler);

    this.resize();
  }

  /**
   * Gets the renderer canvas element.
   *
   * @returns {HTMLCanvasElement} The renderer canvas.
   */
  get domElement() {
    return this.renderer.domElement;
  }

  /**
   * Gets the renderer context used by FlowFX objects.
   *
   * @returns {RendererContext} The renderer context.
   */
  get context() {
    return this.#context;
  }

  /**
   * Gets the scene.
   *
   * @returns {THREE.Scene} The viewport scene.
   */
  get scene() {
    return this.#context.scene;
  }

  /**
   * Gets the camera.
   *
   * @returns {THREE.PerspectiveCamera} The viewport camera.
   */
  get camera() {
    return this.#context.camera;
  }

  /**
   * Gets the renderer.
   *
   * @returns {THREE.WebGLRenderer} The viewport renderer.
   */
  get renderer() {
    return this.#context.renderer;
  }

  /**
   * Gets the current viewport width.
   *
   * @returns {number} The viewport width in pixels.
   */
  get width() {
    return this.#getSize().width;
  }

  /**
   * Gets the current viewport height.
   *
   * @returns {number} The viewport height in pixels.
   */
  get height() {
    return this.#getSize().height;
  }

  /**
   * Gets the current viewport aspect ratio.
   *
   * @returns {number} The width divided by the height.
   */
  get aspect() {
    const { width, height } = this.#getSize();

    return width / height;
  }

  /**
   * Adds objects to the scene.
   *
   * @param {...THREE.Object3D} objects - Objects to add.
   * @returns {void}
   */
  add(...objects) {
    this.scene.add(...objects);
  }

  /**
   * Removes objects from the scene.
   *
   * @param {...THREE.Object3D} objects - Objects to remove.
   * @returns {void}
   */
  remove(...objects) {
    this.scene.remove(...objects);
  }

  /**
   * Renders the current scene from the viewport camera.
   *
   * @returns {void}
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Resizes the renderer and updates the camera projection.
   *
   * @returns {void}
   */
  resize() {
    const { width, height } = this.#getSize();

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Releases renderer resources and removes viewport-owned DOM/event side effects.
   *
   * @returns {void}
   */
  destroy() {
    this.#getWindow().removeEventListener("resize", this.#resizeHandler);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  #createScene(background) {
    const scene = new THREE.Scene();

    if (background !== null) {
      scene.background = new THREE.Color(background);
    }

    return scene;
  }

  #createCamera({ fov, near, far, cameraZ }) {
    const camera = new THREE.PerspectiveCamera(
      fov,
      this.aspect,
      near,
      far
    );

    camera.position.z = cameraZ;

    return camera;
  }

  #createRenderer({ alpha, antialias, pixelRatio }) {
    const renderer = new THREE.WebGLRenderer({
      alpha,
      antialias,
    });

    renderer.setPixelRatio(pixelRatio ?? this.#getWindow().devicePixelRatio ?? 1);

    return renderer;
  }

  #createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 2);
    const directional = new THREE.DirectionalLight(0xffffff, 5);

    directional.position.set(100, 100, 200);

    return [
      ambient,
      directional,
    ];
  }

  #getSize() {
    const currentWindow = this.#getWindow();
    const width = this.container.clientWidth || currentWindow.innerWidth || 1;
    const height = this.container.clientHeight || currentWindow.innerHeight || 1;

    return {
      width,
      height,
    };
  }

  #resolveContainer(container) {
    const currentDocument = this.#getDocument();
    const defaultContainer = currentDocument.body;

    if (container === null && defaultContainer) {
      return defaultContainer;
    }

    if (
      currentDocument.defaultView &&
      container instanceof currentDocument.defaultView.HTMLElement
    ) {
      return container;
    }

    if (container !== null) {
      throw new Error("FlowFX Viewport container must be an HTMLElement.");
    }

    throw new Error("FlowFX Viewport requires a DOM container or document.body.");
  }

  #getDocument() {
    if (typeof document === "undefined") {
      throw new Error("FlowFX Viewport requires a browser document.");
    }

    return document;
  }

  #getWindow() {
    if (typeof window === "undefined") {
      throw new Error("FlowFX Viewport requires a browser window.");
    }

    return window;
  }
}
