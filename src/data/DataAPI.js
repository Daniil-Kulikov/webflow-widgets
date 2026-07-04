const SELECTOR = '[data-ff="extrude"]';
const mountedElements = new WeakMap();

/**
 * Mounts FlowFX objects declared with HTML data attributes.
 *
 * @param {typeof import("../FlowFX.js").default} FlowFX - FlowFX facade class.
 * @param {ParentNode | Element} [root=document] - Root to scan.
 * @returns {Promise<Array<{element: Element, flowfx: FlowFX, object: import("../objects/Extrude.js").default}>>}
 */
export async function mountAll(FlowFX, root = getDocument()) {
  const elements = findExtrudeElements(root);
  const results = await Promise.allSettled(
    elements.map((element) => mountElement(FlowFX, element))
  );

  return results
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value);
}

async function mountElement(FlowFX, element) {
  const mounted = mountedElements.get(element);

  if (mounted) {
    const entry = await mounted;

    if (!entry || entry.object.destroyed) {
      mountedElements.delete(element);
    } else {
      return entry;
    }
  }

  const options = parseExtrudeOptions(element);

  if (!options) {
    return null;
  }

  const mounting = createExtrudeInstance(FlowFX, element, options)
    .catch((error) => {
      mountedElements.delete(element);
      warn(element, `failed to mount: ${error.message}`);
      return null;
    });

  mountedElements.set(element, mounting);

  return mounting;
}

async function createExtrudeInstance(FlowFX, element, options) {
  const flowfx = new FlowFX({
    viewport: {
      container: element,
    },
  });

  try {
    const object = await flowfx.createExtrude(options);

    flowfx.start();

    return {
      element,
      flowfx,
      object,
    };
  } catch (error) {
    flowfx.destroy();
    throw error;
  }
}

function findExtrudeElements(root) {
  const elements = Array.from(root.querySelectorAll?.(SELECTOR) ?? []);

  if (root.matches?.(SELECTOR)) {
    elements.unshift(root);
  }

  return elements;
}

function parseExtrudeOptions(element) {
  const svg = element.getAttribute("data-src");

  if (!svg) {
    warn(element, "missing required data-src attribute.");
    return null;
  }

  const options = {
    svg,
  };

  readNumber(element, "data-depth", "depth", options);
  readColor(element, "data-color", "color", options);
  readNumber(element, "data-roughness", "roughness", options);
  readNumber(element, "data-metalness", "metalness", options);
  readBoolean(element, "data-auto-rotate", "autoRotate", options);
  readNumber(element, "data-rotation-speed", "rotationSpeed", options);

  return options;
}

function readNumber(element, attribute, option, options) {
  const value = element.getAttribute(attribute);

  if (value === null) {
    return;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    warn(element, `ignored invalid ${attribute} value "${value}".`);
    return;
  }

  options[option] = number;
}

function readBoolean(element, attribute, option, options) {
  const value = element.getAttribute(attribute);

  if (value === null) {
    return;
  }

  if (value === "true") {
    options[option] = true;
    return;
  }

  if (value === "false") {
    options[option] = false;
    return;
  }

  warn(element, `ignored invalid ${attribute} value "${value}".`);
}

function readColor(element, attribute, option, options) {
  const value = element.getAttribute(attribute);

  if (value !== null) {
    options[option] = value;
  }
}

function warn(element, message) {
  if (typeof console === "undefined") {
    return;
  }

  console.warn("FlowFX Data API:", message, element);
}

function getDocument() {
  if (typeof document === "undefined") {
    throw new Error("FlowFX.mountAll() requires a browser document.");
  }

  return document;
}
