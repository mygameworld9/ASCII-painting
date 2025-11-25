
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { Copy, Check, Palette, Download } from 'lucide-react';

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

export const AsciiRenderer: React.FC<AsciiRendererProps> = ({ imageSrc, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Refs for data storage to avoid re-calculation in render loop
  const pixelDataRef = useRef<Uint8ClampedArray | null>(null);
  const colorIdMapRef = useRef<Map<string, number>>(new Map());
  const paletteRef = useRef<PaletteItem[]>([]);
  const dimensionsRef = useRef({ cols: 0, rows: 0, charW: 0, charH: 0 });

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

    const { cols, rows, charW, charH } = dimensionsRef.current;
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
  // Reduced step from 8 to 4 for smoother gradients/more accurate colors
  const quantizeVal = (v: number) => Math.min(255, Math.round(v / 4) * 4);

  // 1. PROCESS IMAGE DATA & CALCULATE DIMENSIONS
  // This runs only when Source, Resolution, or RenderMode (dimensions logic) changes.
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
        // HIGH QUALITY SMOOTHING for better downsampling
        offCtx.imageSmoothingQuality = 'high'; 
        offCtx.drawImage(sourceImage, 0, 0, cols, rows);
        const imageData = offCtx.getImageData(0, 0, cols, rows);
        pixelDataRef.current = imageData.data;
      }

  }, [sourceImage, settings.resolution, settings.renderMode, settings.fontSize]);


  // 2. CALCULATE PALETTE (Bead Mode Only)
  // This runs when Pixel Data, Contrast, Invert, or RenderMode changes.
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

      // Static palette calculation (ignoring animation distortion for stability)
      for (let i = 0; i < cols * rows; i++) {
          const pIdx = i * 4;
          let r = pixels[pIdx], g = pixels[pIdx+1], b = pixels[pIdx+2], a = pixels[pIdx+3];

          // Filter transparency
          if (a < 10) continue;

          // Apply Contrast (Corrected Algorithm)
          if (settings.contrast !== 1.0) {
            r = (r - 128) * settings.contrast + 128;
            g = (g - 128) * settings.contrast + 128;
            b = (b - 128) * settings.contrast + 128;
          }
          
          // Clamp
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          
          if (settings.invert) { r=255-r; g=255-g; b=255-b; }

          const qr = quantizeVal(r);
          const qg = quantizeVal(g);
          const qb = quantizeVal(b);
          const qa = quantizeVal(a);

          const key = `${qr},${qg},${qb},${qa}`;
          
          const existing = tempFreq.get(key);
          if (existing) {
              existing.count++;
          } else {
              tempFreq.set(key, { count: 1, r: qr, g: qg, b: qb, a: qa });
          }
      }

      const sortedEntries = Array.from(tempFreq.entries()).sort((a, b) => b[1].count - a[1].count);
      const newPalette: PaletteItem[] = [];
      const newColorMap = new Map<string, number>();

      sortedEntries.forEach((entry, index) => {
          const id = index + 1;
          newColorMap.set(entry[0], id);
          newPalette.push({
              id,
              color: `rgba(${entry[1].r},${entry[1].g},${entry[1].b},${entry[1].a/255})`,
              count: entry[1].count,
              r: entry[1].r, g: entry[1].g, b: entry[1].b, a: entry[1].a
          });
      });

      colorIdMapRef.current = newColorMap;
      paletteRef.current = newPalette;
      setPaletteState(newPalette);

  }, [settings.resolution, settings.contrast, settings.invert, settings.renderMode, pixelDataRef.current]); 


  // 3. RENDER LOOP
  // Runs on animation frame. Uses Refs for data.
  useEffect(() => {
    if (!sourceImage || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    let startTime = Date.now();
    
    const renderFrame = () => {
      const pixels = pixelDataRef.current;
      if (!pixels) {
          animationRef.current = requestAnimationFrame(renderFrame);
          return;
      }

      const now = Date.now();
      const elapsed = (now - startTime) * 0.001 * settings.animationSpeed;
      const intensity = settings.animationIntensity;
      
      const { cols, rows, charW, charH } = dimensionsRef.current;
      
      const isAscii = settings.renderMode === RenderMode.ASCII;
      const isBead = settings.renderMode === RenderMode.BEAD;
      const isPixel = settings.renderMode === RenderMode.PIXEL;
      const isMinecraft = settings.renderMode === RenderMode.MINECRAFT;

      const targetWidth = cols * charW;
      const targetHeight = rows * charH;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Fill Background
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (isAscii) {
          ctx.font = `bold ${settings.fontSize}px "JetBrains Mono", monospace`;
          ctx.textBaseline = 'top';
      }

      if (isBead && settings.showLabels) {
          const labelSize = Math.max(8, settings.fontSize * 0.5);
          ctx.font = `${labelSize}px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
      }
      
      const chars = settings.density;
      const charLen = chars.length;
      const colorMap = colorIdMapRef.current;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          
          let sampleX = x;
          let sampleY = y;

          if (settings.animationMode === AnimationMode.WAVE) {
            const wave = Math.sin(x * 0.1 + elapsed * 2) * (2 * intensity);
            sampleY = Math.floor(y + wave);
          } else if (settings.animationMode === AnimationMode.JELLY) {
             const waveX = Math.sin(y * 0.1 + elapsed) * (1.5 * intensity);
             const waveY = Math.cos(x * 0.1 + elapsed) * (1.5 * intensity);
             sampleX = Math.floor(x + waveX);
             sampleY = Math.floor(y + waveY);
          } else if (settings.animationMode === AnimationMode.SCANLINE) {
             const scan = Math.floor((elapsed * 10) % rows);
             const width = 2 * Math.max(0.5, intensity);
             if (Math.abs(y - scan) < width) {
               sampleX = Math.floor(x + (Math.random() - 0.5) * (2 * intensity));
             }
          }

          sampleX = Math.max(0, Math.min(cols - 1, sampleX));
          sampleY = Math.max(0, Math.min(rows - 1, sampleY));

          const pixelIndex = (sampleY * cols + sampleX) * 4;
          
          // Fast pixel read
          let r = pixels[pixelIndex];
          let g = pixels[pixelIndex + 1];
          let b = pixels[pixelIndex + 2];
          let a = pixels[pixelIndex + 3];
          
          // Corrected Contrast Algorithm (Standard linear multiplier)
          if (settings.contrast !== 1.0) {
             r = (r - 128) * settings.contrast + 128;
             g = (g - 128) * settings.contrast + 128;
             b = (b - 128) * settings.contrast + 128;
          }

          // Clamp
          r = r < 0 ? 0 : (r > 255 ? 255 : r);
          g = g < 0 ? 0 : (g > 255 ? 255 : g);
          b = b < 0 ? 0 : (b > 255 ? 255 : b);

          if (settings.invert && !isAscii) {
             r = 255 - r;
             g = 255 - g;
             b = 255 - b;
          }

          if (isBead) {
              // Quantize for bead color consistency, but use finer step (4) for gradients
              const qr = Math.min(255, Math.round(r / 4) * 4);
              const qg = Math.min(255, Math.round(g / 4) * 4);
              const qb = Math.min(255, Math.round(b / 4) * 4);
              const qa = Math.min(255, Math.round(a / 4) * 4);
              
              if (qa < 10) continue;

              const cx = x * charW + charW / 2;
              const cy = y * charH + charH / 2;
              const radius = (charW / 2) * 0.85; 
              
              ctx.fillStyle = `rgba(${qr},${qg},${qb},${qa/255})`;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();

              if (settings.showLabels) {
                  const key = `${qr},${qg},${qb},${qa}`;
                  const id = colorMap.get(key);
                  if (id !== undefined) {
                      const brightness = (qr * 299 + qg * 587 + qb * 114) / 1000;
                      ctx.fillStyle = brightness > 128 ? '#000000' : '#ffffff';
                      ctx.fillText(id.toString(), cx, cy);
                  }
              }

          } else if (isPixel) {
              if (a < 5) continue;
              ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
              ctx.fillRect(x * charW, y * charH, charW + 0.5, charH + 0.5);

          } else if (isMinecraft) {
              if (a < 20) continue;
              const cx = x * charW;
              const cy = y * charH;
              
              ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
              ctx.fillRect(cx, cy, charW + 0.5, charH + 0.5);

              if (a > 200) {
                  const bevel = Math.max(1, Math.floor(charW * 0.12));
                  ctx.fillStyle = 'rgba(255,255,255,0.2)';
                  ctx.fillRect(cx, cy, charW, bevel);
                  ctx.fillRect(cx, cy, bevel, charH);
                  ctx.fillStyle = 'rgba(0,0,0,0.2)';
                  ctx.fillRect(cx, cy + charH - bevel, charW, bevel);
                  ctx.fillRect(cx + charW - bevel, cy, bevel, charH);
              }

          } else {
              // ASCII
              let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              if (settings.invert) brightness = 1.0 - brightness;

              const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
              let char = chars[charIndex];
              let alpha = a / 255;

              if (settings.animationMode === AnimationMode.MATRIX) {
                const flickerThreshold = 1.0 - (0.1 * intensity);
                const flicker = Math.random() > Math.max(0.5, flickerThreshold) ? 0.5 : 1;
                ctx.globalAlpha = Math.max(0, Math.min(1, brightness * flicker * alpha));
                if (Math.random() > 0.95) {
                   char = chars[Math.floor(Math.random() * charLen)];
                }
              } else {
                ctx.globalAlpha = alpha;
              }

              if (settings.animationMode === AnimationMode.SCANLINE) {
                 ctx.fillStyle = settings.color;
                 if (Math.random() > 0.98) ctx.fillStyle = '#fff';
              } else {
                 ctx.fillStyle = settings.color;
              }

              ctx.fillText(char, x * charW, y * charH);
              ctx.globalAlpha = 1.0; 
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [sourceImage, settings]); 

  // Convert RGB to Hex for Palette Display
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden bg-black/50 rounded-xl border border-zinc-800 shadow-2xl relative group"
    >
      {!sourceImage && (
        <div className="text-zinc-500 animate-pulse">Processing Image...</div>
      )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
         {sourceImage && (
            <button
              onClick={handleDownloadImage}
              className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl"
              title="Download Image"
            >
              <Download size={14} />
              Save Image
            </button>
         )}

         {sourceImage && settings.renderMode === RenderMode.ASCII && (
            <button
              onClick={handleCopyAscii}
              className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl"
              title="Copy text to clipboard"
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied!' : 'Copy Text'}
            </button>
         )}
      </div>

      {/* Bead Palette Legend Overlay */}
      {sourceImage && settings.renderMode === RenderMode.BEAD && settings.showLabels && paletteState.length > 0 && (
          <div className="absolute right-4 top-16 bottom-4 w-48 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 z-10">
              <div className="p-3 border-b border-zinc-700 flex items-center gap-2 bg-zinc-900">
                  <Palette size={14} className="text-indigo-400"/>
                  <h3 className="text-xs font-bold text-zinc-200">Color Palette</h3>
                  <span className="text-[10px] ml-auto text-zinc-500">{paletteState.length} colors</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                  {paletteState.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-800/50 transition-colors">
                          <span className="text-[10px] font-mono font-bold w-4 text-zinc-400 text-right">{p.id}.</span>
                          <div 
                            className="w-6 h-6 rounded-full border border-zinc-600 shadow-sm flex items-center justify-center" 
                            style={{backgroundColor: p.color}}
                          >
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-zinc-300">{rgbToHex(p.r, p.g, p.b)}</span>
                              <span className="text-[9px] text-zinc-600">{p.count} beads</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
