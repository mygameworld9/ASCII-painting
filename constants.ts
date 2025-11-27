

import { AnimationMode, RenderMode } from "./types";

export const DENSITY_SETS = {
  STANDARD: "Ñ@#W$9876543210?!abc;:+=-,._ ",
  SIMPLE: "@%#*+=-:. ",
  COMPLEX: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  BLOCKS: "█▓▒░ ",
};

export const DEFAULT_SETTINGS = {
  resolution: 120, // Width in chars
  density: DENSITY_SETS.COMPLEX,
  color: '#ffffff', // Default to white
  backgroundColor: '#000000',
  contrast: 1.0,
  animationSpeed: 1.0,
  animationIntensity: 1.0,
  animationMode: AnimationMode.STATIC,
  renderMode: RenderMode.ASCII,
  fontSize: 10,
  invert: false,
  showLabels: false,
  extractionThreshold: 20, // Default variance threshold for subject extraction
  motionScript: "const phase = (x * 0.05) + (y * 0.05);\nreturn [\n  Math.sin(t + phase) * i * 2,\n  Math.cos(t * 1.2 + phase) * i * 2\n];"
};