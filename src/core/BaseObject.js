/**
 * Base class for FlowFX scene objects.
 *
 * Subclasses provide object-specific behavior by overriding lifecycle hooks.
 */
export default class BaseObject {
  /**
   * Creates a FlowFX object.
   *
   * @param {import("./RendererContext.js").default} context - Rendering context for the object.
   * @param {object} options - Object options.
   */
  constructor(context, options = {}) {
    this.context = context;
    this.viewport = context;
    this.options = options;
    this.object = null;
    this.loaded = false;
    this.destroyed = false;
  }

  /**
   * Initializes the object once.
   *
   * @returns {Promise<BaseObject>} Resolves with this object after initialization.
   */
  async init() {
    this.#assertActive();

    if (this.loaded) {
      return this;
    }

    await this.onInit();
    this.attach();
    this.loaded = true;

    return this;
  }

  /**
   * Updates the object for one render frame.
   *
   * @param {number} [delta=0] - Time elapsed since the previous frame.
   * @returns {void}
   */
  update(delta = 0) {
    if (!this.loaded || this.destroyed) {
      return;
    }

    this.onUpdate(delta);
  }

  /**
   * Destroys the object once and releases object-owned resources.
   *
   * @returns {void}
   */
  destroy() {
    if (this.destroyed) {
      return;
    }

    this.detach();
    this.onDestroy();
    this.loaded = false;
    this.destroyed = true;
  }

  /**
   * Attaches the root object to the viewport scene.
   *
   * @returns {void}
   */
  attach() {
    if (!this.object) {
      return;
    }

    this.context.scene.add(this.object);
  }

  /**
   * Detaches the root object from the viewport scene.
   *
   * @returns {void}
   */
  detach() {
    if (!this.object) {
      return;
    }

    this.context.scene.remove(this.object);
  }

  /**
   * Hook for subclass initialization work.
   *
   * @returns {Promise<void> | void}
   */
  onInit() {}

  /**
   * Hook for subclass per-frame work.
   *
   * @param {number} delta - Time elapsed since the previous frame.
   * @returns {void}
   */
  onUpdate(delta) {}

  /**
   * Hook for subclass cleanup work.
   *
   * @returns {void}
   */
  onDestroy() {}

  #assertActive() {
    if (this.destroyed) {
      throw new Error("FlowFX object cannot be used after destroy().");
    }
  }
}
