import React, { useRef, useEffect, useState } from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { Copy, Check, Download } from 'lucide-react';

interface AsciiRendererProps {
  imageSrc: string;
  settings: AsciiSettings;
}

interface PaletteItem {
  id: number;
  color: string;
  count: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const AsciiRenderer: React.FC<AsciiRendererProps> = ({ imageSrc, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Refs for data storage to avoid re-calculation in render loop
  const pixelDataRef = useRef<Uint8ClampedArray | null>(null);
  const colorIdMapRef = useRef<Map<string, number>>(new Map());
  const paletteRef = useRef<PaletteItem[]>([]);
  const dimensionsRef = useRef({ cols: 0, rows: 0, charW: 0, charH: 0 });
  const subjectMapRef = useRef<Uint8Array | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [paletteState, setPaletteState] = useState<PaletteItem[]>([]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setSourceImage(img);
    };
  }, [imageSrc]);

  const handleCopyAscii = () => {
    if (!sourceImage || settings.renderMode !== RenderMode.ASCII) return;

    const { cols, rows } = dimensionsRef.current;
    const pixels = pixelDataRef.current;

    if (!pixels || cols === 0) return;

    let asciiString = "";
    const chars = settings.density;
    const charLen = chars.length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const pixelIndex = (y * cols + x) * 4;
        let r = pixels[pixelIndex];
        let g = pixels[pixelIndex + 1];
        let b = pixels[pixelIndex + 2];
        
        // Apply Contrast
        if (settings.contrast !== 1.0) {
             r = (r - 128) * settings.contrast + 128;
             g = (g - 128) * settings.contrast + 128;
             b = (b - 128) * settings.contrast + 128;
        }
        
        // Clamp
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (settings.invert) brightness = 1.0 - brightness;

        const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
        asciiString += chars[charIndex];
      }
      asciiString += "\n";
    }

    navigator.clipboard.writeText(asciiString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modeName = settings.renderMode.toLowerCase();
    link.download = `art-${modeName}-${timestamp}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to quantize color for bead palette
  const quantizeVal = (v: number) => Math.min(255, Math.round(v / 4) * 4);

  // 1. PROCESS IMAGE DATA & CALCULATE DIMENSIONS
  useEffect(() => {
      if (!sourceImage) return;

      const cols = settings.resolution;
      const isAscii = settings.renderMode === RenderMode.ASCII;
      
      const charW = isAscii ? settings.fontSize * 0.6 : settings.fontSize;
      const charH = settings.fontSize;
      
      const aspectRatio = sourceImage.height / sourceImage.width;
      const gridRatio = isAscii ? (charW / charH) : 1.0;
      const rows = Math.floor(cols * aspectRatio * gridRatio);

      // Store dimensions
      dimensionsRef.current = { cols, rows, charW, charH };

      // Extract Pixels
      const offCanvas = document.createElement('canvas');
      offCanvas.width = cols;
      offCanvas.height = rows;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      
      if (offCtx) {
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high'; 
        offCtx.drawImage(sourceImage, 0, 0, cols, rows);
        const imageData = offCtx.getImageData(0, 0, cols, rows);
        pixelDataRef.current = imageData.data;
      }

  }, [sourceImage, settings.resolution, settings.renderMode, settings.fontSize]);

  // 1.5 CALCULATE SUBJECT MAP (For Particle Mode)
  useEffect(() => {
      const pixels = pixelDataRef.current;
      const { cols, rows } = dimensionsRef.current;
      
      if (!pixels || cols === 0 || rows === 0) {
          subjectMapRef.current = null;
          return;
      }

      const map = new Uint8Array(cols * rows);
      const threshold = settings.extractionThreshold;
      
      for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
              const idx = (y * cols + x) * 4;
              const lum = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
              
              let diff = 0;
              let neighbors = 0;

              // Simple neighbor check
              if (x < cols - 1) { diff += Math.abs(((pixels[idx+4] + pixels[idx+5] + pixels[idx+6]) / 3) - lum); neighbors++; }
              if (y < rows - 1) { const nIdx = idx + cols * 4; diff += Math.abs(((pixels[nIdx] + pixels[nIdx+1] + pixels[nIdx+2]) / 3) - lum); neighbors++; }
              
              const avgDiff = neighbors > 0 ? diff / neighbors : 0;
              map[y * cols + x] = avgDiff > threshold ? 1 : 0;
          }
      }
      subjectMapRef.current = map;

  }, [pixelDataRef.current, settings.extractionThreshold, dimensionsRef.current]);


  // 2. CALCULATE PALETTE (Bead Mode Only)
  useEffect(() => {
      const pixels = pixelDataRef.current;
      if (!pixels || settings.renderMode !== RenderMode.BEAD) {
          setPaletteState([]);
          paletteRef.current = [];
          colorIdMapRef.current.clear();
          return;
      }

      const { cols, rows } = dimensionsRef.current;
      const tempFreq = new Map<string, {count: number, r: number, g: number, b: number, a: number}>();

      for (let i = 0; i < cols * rows; i++) {
          const pIdx = i * 4;
          let r = pixels[pIdx], g = pixels[pIdx+1], b = pixels[pIdx+2], a = pixels[pIdx+3];

          if (a < 10) continue;

          // Apply Contrast
          if (settings.contrast !== 1.0) {
            r = (r - 128) * settings.contrast + 128;
            g = (g - 128) * settings.contrast + 128;
            b = (b - 128) * settings.contrast + 128;
          }
          
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));

          const qr = quantizeVal(r);
          const qg = quantizeVal(g);
          const qb = quantizeVal(b);
          
          const key = `${qr},${qg},${qb}`;
          
          if (tempFreq.has(key)) {
              tempFreq.get(key)!.count++;
          } else {
              tempFreq.set(key, { count: 1, r: qr, g: qg, b: qb, a: 255 });
          }
      }

      const sorted = Array.from(tempFreq.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 32);

      const newPalette: PaletteItem[] = sorted.map((p, i) => ({
        ...p,
        id: i + 1,
        color: `rgb(${p.r},${p.g},${p.b})`
      }));
      setPaletteState(newPalette);
      paletteRef.current = newPalette;
      
      const newMap = new Map();
      newPalette.forEach(p => {
          newMap.set(`${p.r},${p.g},${p.b}`, p.id);
      });
      colorIdMapRef.current = newMap;

  }, [pixelDataRef.current, settings.contrast, settings.renderMode]);

  // 3. RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImage || !dimensionsRef.current.cols) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Reset particles on mode change
    if (settings.animationMode !== AnimationMode.PARTICLES) {
        particlesRef.current = [];
    }

    const render = () => {
        const { cols, rows, charW, charH } = dimensionsRef.current;
        const pixels = pixelDataRef.current;
        if (!pixels) return;

        // Resize canvas if needed
        const targetWidth = cols * charW;
        const targetHeight = rows * charH;
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }

        // Fill Background
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Common vars
        const density = settings.density;
        const dLen = density.length;
        const fontSize = settings.fontSize;
        
        if (settings.renderMode === RenderMode.ASCII) {
            ctx.font = `${settings.fontSize}px "JetBrains Mono", monospace`;
            ctx.textBaseline = 'top';
        }

        // Loop Grid
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 4;
                let r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];

                // Apply Contrast
                if (settings.contrast !== 1.0) {
                    r = (r - 128) * settings.contrast + 128;
                    g = (g - 128) * settings.contrast + 128;
                    b = (b - 128) * settings.contrast + 128;
                }
                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                if (settings.invert) brightness = 1.0 - brightness;

                const posX = x * charW;
                const posY = y * charH;

                // --- ASCII RENDER ---
                if (settings.renderMode === RenderMode.ASCII) {
                    const charIdx = Math.floor(Math.max(0, Math.min(1, brightness)) * (dLen - 1));
                    const char = density[charIdx];
                    ctx.fillStyle = settings.color === '#ffffff' || settings.color === '#00ff41' 
                        ? settings.color // Use solid color if default white/matrix
                        : `rgb(${r},${g},${b})`; // Else use true color
                    ctx.fillText(char, posX, posY);
                } 
                
                // --- BEAD RENDER ---
                else if (settings.renderMode === RenderMode.BEAD) {
                     const qr = quantizeVal(r), qg = quantizeVal(g), qb = quantizeVal(b);
                     const key = `${qr},${qg},${qb}`;
                     const id = colorIdMapRef.current.get(key) || 0;
                     
                     ctx.fillStyle = `rgb(${qr},${qg},${qb})`;
                     ctx.beginPath();
                     const radius = (charW / 2) * 0.85;
                     ctx.arc(posX + charW/2, posY + charH/2, radius, 0, Math.PI * 2);
                     ctx.fill();

                     // Bead ID
                     if (settings.showLabels && id > 0 && fontSize > 8) {
                         ctx.fillStyle = brightness > 0.5 ? '#000' : '#fff';
                         ctx.font = `bold ${fontSize * 0.4}px Inter, sans-serif`;
                         ctx.textAlign = 'center';
                         ctx.textBaseline = 'middle';
                         ctx.fillText(id.toString(), posX + charW/2, posY + charH/2);
                     }
                }

                // --- PIXEL RENDER ---
                else if (settings.renderMode === RenderMode.PIXEL) {
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(posX, posY, charW, charH);
                }

                // --- MINECRAFT RENDER ---
                else if (settings.renderMode === RenderMode.MINECRAFT) {
                    // Main face
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(posX, posY, charW, charH);
                    
                    // Top highlight (bevel)
                    ctx.fillStyle = `rgba(255,255,255,0.2)`;
                    ctx.beginPath();
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(posX + charW, posY);
                    ctx.lineTo(posX + charW - 2, posY + 2);
                    ctx.lineTo(posX + 2, posY + 2);
                    ctx.fill();

                    // Left highlight
                    ctx.beginPath();
                    ctx.moveTo(posX, posY);
                    ctx.lineTo(posX + 2, posY + 2);
                    ctx.lineTo(posX + 2, posY + charH - 2);
                    ctx.lineTo(posX, posY + charH);
                    ctx.fill();

                    // Right shadow
                    ctx.fillStyle = `rgba(0,0,0,0.2)`;
                    ctx.beginPath();
                    ctx.moveTo(posX + charW, posY);
                    ctx.lineTo(posX + charW, posY + charH);
                    ctx.lineTo(posX + charW - 2, posY + charH - 2);
                    ctx.lineTo(posX + charW - 2, posY + 2);
                    ctx.fill();

                    // Bottom shadow
                    ctx.beginPath();
                    ctx.moveTo(posX, posY + charH);
                    ctx.lineTo(posX + charW, posY + charH);
                    ctx.lineTo(posX + charW - 2, posY + charH - 2);
                    ctx.lineTo(posX + 2, posY + charH - 2);
                    ctx.fill();
                }
            }
        }

        // --- PARTICLES ---
        if (settings.animationMode === AnimationMode.PARTICLES && subjectMapRef.current) {
            const subjectMap = subjectMapRef.current;
            // Spawn particles
            const spawnRate = Math.floor(settings.animationIntensity * 5);
            for(let i=0; i < spawnRate; i++) {
                 // Try to find a subject pixel to spawn from
                 const rx = Math.floor(Math.random() * cols);
                 const ry = Math.floor(Math.random() * rows);
                 if (subjectMap[ry * cols + rx] === 1) {
                     // Get color of spawn point
                     const idx = (ry * cols + rx) * 4;
                     const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
                     
                     particlesRef.current.push({
                         x: rx * charW,
                         y: ry * charH,
                         vx: (Math.random() - 0.5) * settings.animationSpeed,
                         vy: (Math.random() - 1.5) * settings.animationSpeed, // Float up
                         life: 1.0,
                         maxLife: 1.0,
                         color: `rgb(${r},${g},${b})`,
                         size: Math.random() * charW
                     });
                 }
            }

            // Update & Draw Particles
            ctx.globalCompositeOperation = 'screen'; // Additive blending for glow
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02 * settings.animationSpeed;
                
                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                
                if (settings.renderMode === RenderMode.ASCII) {
                    ctx.fillText('.', p.x, p.y);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
        }

        if (settings.animationMode !== AnimationMode.STATIC) {
            animationRef.current = requestAnimationFrame(render);
        }
    };

    render();

    return () => {
        cancelAnimationFrame(animationRef.current);
    };
  }, [sourceImage, settings, dimensionsRef.current, pixelDataRef.current]);


  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden group">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full shadow-2xl transition-all duration-300"
        style={{ imageRendering: settings.renderMode === RenderMode.ASCII ? 'auto' : 'pixelated' }}
      />
      
      {/* Overlay Controls */}
      <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        {settings.renderMode === RenderMode.ASCII && (
          <button 
            onClick={handleCopyAscii}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 text-zinc-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg border border-zinc-700 hover:border-indigo-500 backdrop-blur-md"
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            <span className="text-sm font-medium">{isCopied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        )}
        
        <button 
          onClick={handleDownloadImage}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 text-zinc-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg border border-zinc-700 hover:border-indigo-500 backdrop-blur-md"
        >
          <Download size={16} />
          <span className="text-sm font-medium">Download</span>
        </button>
      </div>

      {/* Bead Palette Legend */}
      {settings.renderMode === RenderMode.BEAD && settings.showLabels && paletteState.length > 0 && (
         <div className="absolute top-6 left-6 p-4 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-700 shadow-2xl max-h-[80vh] overflow-y-auto w-48 opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-xs font-bold text-zinc-400 uppercase mb-3 tracking-wider">Color Palette</h3>
            <div className="space-y-2">
                {paletteState.map(p => (
                    <div key={p.id} className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-zinc-500 w-4 text-right">{p.id}</span>
                        <div 
                            className="w-4 h-4 rounded-full border border-white/10 shadow-sm" 
                            style={{ backgroundColor: `rgb(${p.r},${p.g},${p.b})` }}
                        />
                        <span className="text-zinc-300 ml-auto font-mono">{p.count}</span>
                    </div>
                ))}
            </div>
         </div>
      )}
    </div>
  );
};