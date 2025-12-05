

export enum AnimationMode {
  STATIC = 'STATIC',
  PARTICLES = 'PARTICLES'
}

export enum RenderMode {
  ASCII = 'ASCII',
  BEAD = 'BEAD',
  PIXEL = 'PIXEL',
  MINECRAFT = 'MINECRAFT'
}

export interface AsciiSettings {
  resolution: number; // 0.1 to 1.0
  density: string; // The char set
  color: string;
  backgroundColor: string;
  transparentBackground: boolean; // New setting
  contrast: number; // 0.5 to 2.0
  animationSpeed: number;
  animationIntensity: number; // New control for amplitude/strength
  animationMode: AnimationMode;
  renderMode: RenderMode;
  fontSize: number;
  invert: boolean;
  showLabels: boolean;
  extractionThreshold: number; // 0 to 100, determines what is "background" vs "subject"
  motionScript: string; // Custom JS expression for particle movement
}

export interface GeneratedImage {
  mimeType: string;
  data: string; // base64
}

// GENETIC ALGORITHM TYPES
export type GeneFunction = 'sin' | 'cos' | 'tan';

export interface Genome {
    id: string;
    generation: number;
    // Genes
    baseSpeed: number;
    ampX: number;
    ampY: number;
    freqX: number;
    freqY: number;
    phaseX: number;
    phaseY: number;
    funcX: GeneFunction;
    funcY: GeneFunction;
    shearFactor: number; // For running leaning effect
    compressionFactor: number; // For jumping squash/stretch
}