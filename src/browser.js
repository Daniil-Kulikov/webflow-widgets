import FlowFX from "./FlowFX.js";

function mountWhenReady() {
  FlowFX.mountAll().catch((error) => {
    console.warn("FlowFX browser auto-mount failed:", error);
  });
}

if (typeof window !== "undefined") {
  window.FlowFX = FlowFX;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWhenReady, {
      once: true,
    });
  } else {
    mountWhenReady();
  }
}

export default FlowFX;
