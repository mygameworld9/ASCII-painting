import { Genome, GeneFunction } from "../types";

const FUNCTIONS: GeneFunction[] = ['sin', 'cos'];

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const createRandomGenome = (generation = 0): Genome => ({
    id: Math.random().toString(36).substr(2, 9),
    generation,
    baseSpeed: randomRange(0.5, 2.0),
    ampX: randomRange(0, 10),
    ampY: randomRange(0, 10),
    freqX: randomRange(0.1, 2.0),
    freqY: randomRange(0.1, 2.0),
    phaseX: randomRange(0, Math.PI * 2),
    phaseY: randomRange(0, Math.PI * 2),
    funcX: randomChoice(FUNCTIONS),
    funcY: randomChoice(FUNCTIONS),
    shearFactor: 0,
    compressionFactor: 0
});

// Presets that approximate specific actions
export const getSeedGenome = (type: 'runner' | 'jumper' | 'shaker'): Genome => {
    const base = createRandomGenome(0);
    
    if (type === 'runner') {
        // Runner: High X shear, bobbing Y
        return {
            ...base,
            baseSpeed: 1.5,
            ampX: 2.0, // Horizontal swaying
            ampY: 5.0, // Vertical Bobbing
            freqX: 0.5,
            freqY: 2.0, // Bob faster than sway
            funcX: 'cos',
            funcY: 'sin', // distinct phases
            shearFactor: 0.15, // Lean forward
            compressionFactor: 0
        };
    } else if (type === 'jumper') {
        // Jumper: High Y, compression
        return {
            ...base,
            baseSpeed: 1.2,
            ampX: 0,
            ampY: 15.0, // Big jump
            freqY: 1.0,
            funcY: 'sin', // Clean sine wave jump
            phaseY: 0,
            shearFactor: 0,
            compressionFactor: 0.2 // Squash on landing (simulated)
        };
    } else {
        // Shaker (Chaos)
        return {
            ...base,
            baseSpeed: 3.0,
            ampX: 5.0,
            ampY: 5.0,
            freqX: 5.0,
            freqY: 5.0,
            shearFactor: 0,
            compressionFactor: 0
        };
    }
};

export const mutateGenome = (parent: Genome, mutationRate = 0.3): Genome => {
    const g = { ...parent };
    g.id = Math.random().toString(36).substr(2, 9);
    g.generation = parent.generation + 1;

    // Helper to mutate a single number
    const m = (val: number, range: number) => {
        if (Math.random() < mutationRate) {
            return val + randomRange(-range, range);
        }
        return val;
    };

    g.baseSpeed = Math.max(0.1, m(g.baseSpeed, 0.5));
    g.ampX = m(g.ampX, 3.0);
    g.ampY = m(g.ampY, 3.0);
    g.freqX = m(g.freqX, 0.5);
    g.freqY = m(g.freqY, 0.5);
    g.phaseX = m(g.phaseX, 0.5);
    g.phaseY = m(g.phaseY, 0.5);
    g.shearFactor = m(g.shearFactor, 0.05);
    g.compressionFactor = m(g.compressionFactor, 0.05);

    if (Math.random() < 0.1) g.funcX = randomChoice(FUNCTIONS);
    if (Math.random() < 0.1) g.funcY = randomChoice(FUNCTIONS);

    return g;
};

// Compiles the genome into the JS script string used by AsciiRenderer
export const genomeToScript = (g: Genome): string => {
    // We construct a math expression string.
    // Available vars: x, y, t, i, w, h
    
    // X Equation
    // dx = Amp * Func(t * freq + y * shear + phase)
    const xEq = `${g.ampX.toFixed(2)} * Math.${g.funcX}(t * ${g.freqX.toFixed(2)} + y * ${g.shearFactor.toFixed(3)} + ${g.phaseX.toFixed(2)})`;
    
    // Y Equation
    // dy = Amp * Func(t * freq + x * 0 (usually) + phase)
    // Add compression: modifying Y based on absolute Y position or time?
    // Let's keep simple: dy varies with time.
    // For jumping, we want dy to be always negative (up) then positive (down).
    // Let's stick to standard wave for now.
    
    // Compression trick: if jumping (high AmpY), use abs(sin) for bouncing look? 
    // Or just simple sin. Let's let evolution decide params.
    const yEq = `${g.ampY.toFixed(2)} * Math.${g.funcY}(t * ${g.freqY.toFixed(2)} + ${g.phaseY.toFixed(2)})`;
    
    return `
      // Genome: ${g.id} (Gen ${g.generation})
      // Speed Multiplier handled by global settings, but we bake baseSpeed here
      const localT = t * ${g.baseSpeed.toFixed(2)};
      
      const dx = ${xEq} * i;
      const dy = ${yEq} * i;
      
      // Apply Compression (Squash) based on movement
      // If moving down (dy > 0), maybe expand x?
      // const stretch = 1.0 + (${g.compressionFactor} * Math.sin(localT));
      
      return [dx, dy];
    `;
};