
export enum AnimationMode {
  STATIC = 'STATIC',
  WAVE = 'WAVE',
  JELLY = 'JELLY',
  MATRIX = 'MATRIX',
  SCANLINE = 'SCANLINE'
}

export enum RenderMode {
  ASCII = 'ASCII',
  BEAD = 'BEAD',
  PIXEL = 'PIXEL',
  HD = 'HD'
}

export interface AsciiSettings {
  resolution: number; // 0.1 to 1.0
  density: string; // The char set
  color: string;
  backgroundColor: string;
  contrast: number; // 0.5 to 2.0
  animationSpeed: number;
  animationMode: AnimationMode;
  renderMode: RenderMode;
  fontSize: number;
  invert: boolean;
}

export interface GeneratedImage {
  mimeType: string;
  data: string; // base64
}
