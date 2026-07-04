import FlowFX from "./FlowFX.js";

const container = document.querySelector("#app");

const flowfx = new FlowFX({
  viewport: {
    container,
  },
});

await flowfx.createExtrude({
  svg: "/logo.svg",
});

flowfx.start();
