

import { AnimationMode, RenderMode } from "./types";

export const DENSITY_SETS = {
  STANDARD: "Ñ@#W$9876543210?!abc;:+=-,._ ",
  SIMPLE: "@%#*+=-:. ",
  COMPLEX: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  BLOCKS: "█▓▒░ ",
  MATRIX: "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ123457890:・.=*+-<>",
};

export const DEFAULT_SETTINGS = {
  resolution: 120, // Width in chars
  density: DENSITY_SETS.COMPLEX,
  color: '#00ff41', // Matrix green default
  backgroundColor: '#000000',
  contrast: 1.0,
  animationSpeed: 1.0,
  animationIntensity: 1.0,
  animationMode: AnimationMode.STATIC, // Changed to STATIC
  renderMode: RenderMode.ASCII,
  fontSize: 10,
  invert: false,
  showLabels: false,
  extractionThreshold: 20, // Default variance threshold for subject extraction
};