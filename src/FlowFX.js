import Viewport from "./core/Viewport.js";
import { mountAll as mountAllDataObjects } from "./data/DataAPI.js";
import Extrude from "./objects/Extrude.js";
import MaterialFactory from "./materials/MaterialFactory.js";

/**
 * FlowFX library facade for creating and rendering interactive SVG objects.
 */
class FlowFX {
  /**
   * Creates a FlowFX runtime.
   *
   * @param {object} options - Runtime options.
   * @param {object} options.viewport - Viewport options.
   */
  constructor({ viewport = {} } = {}) {
    this.viewport = new Viewport(viewport);
    this.objects = new Set();
    this.animationFrame = null;
  }

  /**
   * Creates, loads, and tracks an extruded SVG object.
   *
   * @param {object} options - Extrude options.
   * @returns {Promise<Extrude>} The initialized extruded object.
   */
  async createExtrude(options) {
    const object = new Extrude(this.viewport.context, options);

    await object.init();
    this.objects.add(object);

    return object;
  }

  /**
   * Tracks an existing FlowFX object for animation updates.
   *
   * @param {object} object - Object with an optional update method.
   * @returns {object} The tracked object.
   */
  add(object) {
    this.objects.add(object);

    return object;
  }

  /**
   * Stops tracking an existing FlowFX object.
   *
   * @param {object} object - Object to stop tracking.
   * @returns {void}
   */
  remove(object) {
    this.objects.delete(object);
  }

  /**
   * Starts the render loop.
   *
   * @returns {void}
   */
  start() {
    if (this.animationFrame !== null) return;

    const tick = () => {
      this.animationFrame = requestAnimationFrame(tick);
      this.render();
    };

    tick();
  }

  /**
   * Stops the render loop.
   *
   * @returns {void}
   */
  stop() {
    if (this.animationFrame === null) return;

    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  /**
   * Updates tracked objects and renders one frame.
   *
   * @returns {void}
   */
  render() {
    this.objects.forEach((object) => {
      object.update?.();
    });

    this.viewport.render();
  }

  /**
   * Resizes the viewport to match its container.
   *
   * @returns {void}
   */
  resize() {
    this.viewport.resize();
  }

  /**
   * Stops rendering and releases FlowFX resources.
   *
   * @returns {void}
   */
  destroy() {
    this.stop();

    this.objects.forEach((object) => {
      object.destroy?.();
    });

    this.objects.clear();
    this.viewport.destroy();
  }

  /**
   * Mounts FlowFX objects declared with HTML data attributes.
   *
   * @param {ParentNode | Element} [root=document] - Root element or document to scan.
   * @returns {Promise<Array<{element: Element, flowfx: FlowFX, object: Extrude}>>} Mounted objects.
   */
  static mountAll(root) {
    return mountAllDataObjects(FlowFX, root);
  }
}

FlowFX.Extrude = Extrude;
FlowFX.MaterialFactory = MaterialFactory;
FlowFX.Viewport = Viewport;

export default FlowFX;
