/// <reference types="@figma/plugin-typings" />
// import { Delaunay } from "d3-delaunay";

figma.showUI(__html__, { width: 360, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "apply-pattern") {
    const base64 = msg.base64;

    if (!base64) {
      figma.notify("No image data received.");
      return;
    }

    if (figma.currentPage.selection.length === 0) {
      figma.notify("Select a shape first.");
      return;
    }

    const node = figma.currentPage.selection[0];

    if (!("fills" in node)) {
      figma.notify("Selected object doesn't support fills.");
      return;
    }

    try {
      const imageBytes = base64ToBytes(base64);
      const image = figma.createImage(imageBytes);
      const imageHash = image.hash;

      const newFills: Paint[] = [
        {
          type: "IMAGE",
          scaleMode: "FILL",
          imageHash,
        },
      ];

      node.fills = newFills;
      figma.notify("Pattern applied!");
    } catch (error) {
      console.error(error);
      figma.notify("Failed to apply pattern.");
    }
  }
};

function base64ToBytes(base64: string): Uint8Array {
  const binary = decodeBase64(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  let buffer = 0;
  let accumulatedBits = 0;

  for (let i = 0; i < base64.length; i++) {
    const char = base64.charAt(i);
    const index = chars.indexOf(char);
    if (index === -1) continue;

    buffer = (buffer << 6) | index;
    accumulatedBits += 6;

    if (accumulatedBits >= 8) {
      accumulatedBits -= 8;
      str += String.fromCharCode((buffer >> accumulatedBits) & 0xff);
    }
  }

  return str;
}