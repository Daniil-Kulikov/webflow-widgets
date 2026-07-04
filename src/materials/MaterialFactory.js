import * as THREE from "three";

/**
 * Creates Three.js materials for FlowFX objects.
 */
export default class MaterialFactory {
  /**
   * Creates a standard physically based material.
   *
   * @param {object} options - Material options.
   * @param {THREE.ColorRepresentation} options.color - Material color.
   * @param {number} options.roughness - Material roughness.
   * @param {number} options.metalness - Material metalness.
   * @returns {THREE.MeshStandardMaterial} The configured material.
   */
  static createStandardMaterial({
    color,
    roughness,
    metalness,
  }) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
    });
  }
}
