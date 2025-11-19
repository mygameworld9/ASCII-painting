import { AnimationMode } from "./types";

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
  animationMode: AnimationMode.WAVE, // String matching enum for UI
  fontSize: 10,
  invert: false,
};