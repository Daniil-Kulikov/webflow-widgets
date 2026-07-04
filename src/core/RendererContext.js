/**
 * Lightweight rendering dependencies shared with FlowFX objects.
 */
export default class RendererContext {
  /**
   * Creates a renderer context.
   *
   * @param {object} options - Rendering dependencies.
   * @param {import("three").Scene} options.scene - Three.js scene.
   * @param {import("three").PerspectiveCamera} options.camera - Three.js camera.
   * @param {import("three").WebGLRenderer} options.renderer - Three.js renderer.
   */
  constructor({ scene, camera, renderer }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }
}
