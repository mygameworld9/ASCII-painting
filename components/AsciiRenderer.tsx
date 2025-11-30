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
  const subjectMapRef = useRef<Uint8Array | null>(null);

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

  const handleCopyText = async () => {
    if (!sourceImage) return;
    
    const isAscii = settings.renderMode === RenderMode.ASCII;
    const isMinecraft = settings.renderMode === RenderMode.MINECRAFT;

    if (!isAscii && !isMinecraft) return;

    const { cols, rows } = dimensionsRef.current;
    const pixels = pixelDataRef.current;

    if (!pixels || cols === 0) return;

    let resultString = "";
    const chars = settings.density;
    const charLen = chars.length;

    // Palette for Minecraft Emoji Copy
    const emojiPalette = [
        { char: '⬛', r: 0, g: 0, b: 0 },
        { char: '⬜', r: 255, g: 255, b: 255 },
        { char: '🟥', r: 255, g: 0, b: 0 },
        { char: '🟦', r: 0, g: 0, b: 255 },
        { char: '🟩', r: 0, g: 255, b: 0 },
        { char: '🟨', r: 255, g: 255, b: 0 },
        { char: '🟧', r: 255, g: 165, b: 0 },
        { char: '🟪', r: 128, g: 0, b: 128 },
        { char: '🟫', r: 165, g: 42, b: 42 },
    ];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const pixelIndex = (y * cols + x) * 4;
        let r = pixels[pixelIndex];
        let g = pixels[pixelIndex + 1];
        let b = pixels[pixelIndex + 2];
        let a = pixels[pixelIndex + 3];

        // CRITICAL: Respect transparency for "No Background" copy
        if (a < 10) {
            resultString += " ";
            continue;
        }
        
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

        // Apply Invert logic
        if (settings.invert) {
             r = 255 - r;
             g = 255 - g;
             b = 255 - b;
        }

        if (isAscii) {
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
            resultString += chars[charIndex];
        } else if (isMinecraft) {
            // Find closest emoji block
            let minDist = Infinity;
            let closest = emojiPalette[0].char;
            
            for (const p of emojiPalette) {
                const d = (r - p.r) ** 2 + (g - p.g) ** 2 + (b - p.b) ** 2;
                if (d < minDist) {
                    minDist = d;
                    closest = p.char;
                }
            }
            resultString += closest;
        }
      }
      resultString += "\n";
    }

    try {
        await navigator.clipboard.writeText(resultString);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        // Fallback for focus issues or unsupported environments
        const textarea = document.createElement('textarea');
        textarea.value = resultString;
        textarea.style.position = 'fixed'; // Prevent scrolling
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            document.execCommand('copy');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (fallbackErr) {
            console.error('Copy failed', fallbackErr);
            alert('Failed to copy text to clipboard.');
        }
        
        document.body.removeChild(textarea);
    }
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
        // HIGH QUALITY SMOOTHING for better downsampling
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

              // Check 4 neighbors
              if (x < cols - 1) {
                  const nIdx = idx + 4;
                  const nLum = (pixels[nIdx] + pixels[nIdx+1] + pixels[nIdx+2]) / 3;
                  diff += Math.abs(nLum - lum);
                  neighbors++;
              }
              if (y < rows - 1) {
                   const nIdx = idx + cols * 4;
                   const nLum = (pixels[nIdx] + pixels[nIdx+1] + pixels[nIdx+2]) / 3;
                   diff += Math.abs(nLum - lum);
                   neighbors++;
              }
              if (x > 0) {
                  const nIdx = idx - 4;
                  const nLum = (pixels[nIdx] + pixels[nIdx+1] + pixels[nIdx+2]) / 3;
                  diff += Math.abs(nLum - lum);
                  neighbors++;
              }
              if (y > 0) {
                  const nIdx = idx - cols * 4;
                  const nLum = (pixels[nIdx] + pixels[nIdx+1] + pixels[nIdx+2]) / 3;
                  diff += Math.abs(nLum - lum);
                  neighbors++;
              }
              
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

          if (settings.contrast !== 1.0) {
            r = (r - 128) * settings.contrast + 128;
            g = (g - 128) * settings.contrast + 128;
            b = (b - 128) * settings.contrast + 128;
          }
          
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

  // COMPILE MOTION SCRIPT
  const motionFn = useMemo(() => {
    if (settings.animationMode !== AnimationMode.PARTICLES) return null;
    try {
      // Create a function from the string. Safety: This is client-side evaluation of user string.
      // x, y, t, i (intensity), w (width), h (height)
      return new Function('x', 'y', 't', 'i', 'w', 'h', settings.motionScript || 'return [0,0];');
    } catch (e) {
      console.warn("Invalid motion script", e);
      return () => [0,0];
    }
  }, [settings.motionScript, settings.animationMode]);

  // 3. RENDER LOOP
  useEffect(() => {
    if (!sourceImage || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    // We need alpha: true to support transparent backgrounds
    const ctx = canvas.getContext('2d', { alpha: true }); 
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
      const isParticleMode = settings.animationMode === AnimationMode.PARTICLES;

      const targetWidth = cols * charW;
      const targetHeight = rows * charH;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Fill Background
      if (settings.transparentBackground) {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

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
      const subjectMap = subjectMapRef.current;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          
          let sampleX = x;
          let sampleY = y;
          let particleOffsetX = 0;
          let particleOffsetY = 0;
          
          // Particle Mode - Extraction & Animation
          if (isParticleMode) {
              // Check pre-calculated map
              let isSubject = true;
              if (subjectMap) {
                  isSubject = subjectMap[y * cols + x] === 1;
              }

              if (!isSubject) {
                  continue; // Skip background
              } else if (motionFn) {
                 // Dynamic Motion Script
                 try {
                     // @ts-ignore
                     const [dx, dy] = motionFn(x, y, elapsed, intensity, cols, rows);
                     particleOffsetX = dx;
                     particleOffsetY = dy;
                 } catch (e) {
                     // Fallback in case of runtime error in script
                     particleOffsetX = 0;
                     particleOffsetY = 0;
                 }
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

          // Corrected Contrast
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
          
          const drawX = x * charW + particleOffsetX;
          const drawY = y * charH + particleOffsetY;

          if (isBead) {
              const qr = Math.min(255, Math.round(r / 4) * 4);
              const qg = Math.min(255, Math.round(g / 4) * 4);
              const qb = Math.min(255, Math.round(b / 4) * 4);
              const qa = Math.min(255, Math.round(a / 4) * 4);
              
              if (qa < 10) continue;

              const cx = drawX + charW / 2;
              const cy = drawY + charH / 2;
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
              ctx.fillRect(drawX, drawY, charW + 0.5, charH + 0.5);

          } else if (isMinecraft) {
              if (a < 20) continue;
              
              ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
              ctx.fillRect(drawX, drawY, charW + 0.5, charH + 0.5);

              if (a > 200) {
                  const bevel = Math.max(1, Math.floor(charW * 0.12));
                  ctx.fillStyle = 'rgba(255,255,255,0.2)';
                  ctx.fillRect(drawX, drawY, charW, bevel);
                  ctx.fillRect(drawX, drawY, bevel, charH);
                  ctx.fillStyle = 'rgba(0,0,0,0.2)';
                  ctx.fillRect(drawX, drawY + charH - bevel, charW, bevel);
                  ctx.fillRect(drawX + charW - bevel, drawY, bevel, charH);
              }

          } else {
              // ASCII
              let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              if (settings.invert) brightness = 1.0 - brightness;

              const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
              let char = chars[charIndex];
              let alpha = a / 255;

              ctx.globalAlpha = alpha;
              ctx.fillStyle = settings.color;

              ctx.fillText(char, drawX, drawY);
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
  }, [sourceImage, settings, motionFn]); 

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden bg-black/50 rounded-xl border border-zinc-800 shadow-2xl relative group"
    >
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#1f1f22_25%,transparent_25%,transparent_75%,#1f1f22_75%,#1f1f22),linear-gradient(45deg,#1f1f22_25%,transparent_25%,transparent_75%,#1f1f22_75%,#1f1f22)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-20 pointer-events-none -z-10" />

      {!sourceImage && (
        <div className="text-zinc-500 animate-pulse">Processing Image...</div>
      )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-20">
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

         {sourceImage && (settings.renderMode === RenderMode.ASCII || settings.renderMode === RenderMode.MINECRAFT) && (
            <button
              onClick={handleCopyText}
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