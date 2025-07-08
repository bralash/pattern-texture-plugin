(() => {
  // code.ts
  figma.showUI(__html__, { width: 360, height: 600 });
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "generate-noise") {
      const { scale, octaves, color1, color2 } = msg;
      const base64 = await generateNoiseTexture(scale, octaves, color1, color2);
      figma.ui.postMessage({ type: "update-preview", patternData: base64 });
    } else if (msg.type === "generate-grid") {
      const { size, lineThickness, color } = msg;
      const base64 = await generateGridPattern(size, lineThickness, color);
      figma.ui.postMessage({ type: "update-preview", patternData: base64 });
    } else if (msg.type === "apply-pattern") {
      const previewCanvas = figma.ui;
      figma.ui.postMessage({ type: "request-preview" });
      const imageData = await figma.clientStorage.getAsync("latestPattern");
      if (imageData && figma.currentPage.selection.length > 0) {
        const selectedNode = figma.currentPage.selection[0];
        const imageBytes = base64ToBytes(imageData);
        const imageHash = figma.createImage(imageBytes).hash;
        if ("fills" in selectedNode) {
          const newFills = [
            {
              type: "IMAGE",
              scaleMode: "FILL",
              imageHash
            }
          ];
          selectedNode.fills = newFills;
        }
      } else {
        figma.notify("No image pattern to apply or nothing selected.");
      }
    }
  };
  async function generateNoiseTexture(scale, octaves, color1, color2) {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = Math.floor(Math.random() * 255);
      const t = noise / 255;
      const r = lerpColor(color1, color2, t, "r");
      const g = lerpColor(color1, color2, t, "g");
      const b = lerpColor(color1, color2, t, "b");
      imgData.data[i + 0] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const base64 = canvas.toDataURL();
    await figma.clientStorage.setAsync("latestPattern", base64.split(",")[1]);
    return base64;
  }
  async function generateGridPattern(cellSize, lineThickness, color) {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    for (let x = 0; x <= canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    const base64 = canvas.toDataURL();
    await figma.clientStorage.setAsync("latestPattern", base64.split(",")[1]);
    return base64;
  }
  function createCanvas(width, height) {
    return new OffscreenCanvas(width, height);
  }
  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: bigint >> 16 & 255,
      g: bigint >> 8 & 255,
      b: bigint & 255
    };
  }
  function lerpColor(c1, c2, t, channel) {
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    return Math.floor(rgb1[channel] + (rgb2[channel] - rgb1[channel]) * t);
  }
  function base64ToBytes(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
})();
