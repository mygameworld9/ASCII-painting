
import React, { useRef, useEffect, useState } from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { Copy, Check } from 'lucide-react';

interface AsciiRendererProps {
  imageSrc: string;
  settings: AsciiSettings;
}

export const AsciiRenderer: React.FC<AsciiRendererProps> = ({ imageSrc, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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

    const cols = settings.resolution;
    const charW = settings.fontSize * 0.6;
    const charH = settings.fontSize;
    const aspectRatio = sourceImage.height / sourceImage.width;
    const rows = Math.floor(cols * aspectRatio * (charW / charH));

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cols;
    offCanvas.height = rows;
    const ctx = offCanvas.getContext('2d');
    
    if (!ctx) return;

    ctx.drawImage(sourceImage, 0, 0, cols, rows);
    const imageData = ctx.getImageData(0, 0, cols, rows);
    const pixels = imageData.data;

    let asciiString = "";
    const chars = settings.density;
    const charLen = chars.length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const pixelIndex = (y * cols + x) * 4;
        let r = pixels[pixelIndex];
        let g = pixels[pixelIndex + 1];
        let b = pixels[pixelIndex + 2];

        // Apply Contrast (same as render loop)
        if (settings.contrast !== 1.0) {
             const factor = (259 * (settings.contrast * 255 + 255)) / (255 * (259 - settings.contrast * 255));
             r = factor * (r - 128) + 128;
             g = factor * (g - 128) + 128;
             b = factor * (b - 128) + 128;
        }

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

  // Rendering Loop
  useEffect(() => {
    if (!sourceImage || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true }); 
    
    if (!offCtx) return;

    let startTime = Date.now();
    
    const renderFrame = () => {
      const now = Date.now();
      const elapsed = (now - startTime) * 0.001 * settings.animationSpeed;
      
      const isAscii = settings.renderMode === RenderMode.ASCII;
      const isBead = settings.renderMode === RenderMode.BEAD;
      const isPixel = settings.renderMode === RenderMode.PIXEL;
      const isHD = settings.renderMode === RenderMode.HD;

      // --- HD RENDER PATH ---
      if (isHD) {
          const container = containerRef.current;
          if (!container) return;
          
          // Fill container maintaining aspect ratio
          const maxWidth = container.clientWidth;
          const maxHeight = container.clientHeight;
          const imgAspect = sourceImage.width / sourceImage.height;
          const containerAspect = maxWidth / maxHeight;

          let drawW, drawH;
          if (containerAspect > imgAspect) {
              drawH = maxHeight;
              drawW = maxHeight * imgAspect;
          } else {
              drawW = maxWidth;
              drawH = maxWidth / imgAspect;
          }

          if (canvas.width !== drawW || canvas.height !== drawH) {
              canvas.width = drawW;
              canvas.height = drawH;
          }

          // Fill Background
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, drawW, drawH);

          // Filter for contrast/invert
          const contrastVal = settings.contrast * 100;
          const invertVal = settings.invert ? 100 : 0;
          ctx.filter = `contrast(${contrastVal}%) invert(${invertVal}%)`;

          // Animation Logic for HD
          if (settings.animationMode === AnimationMode.WAVE) {
              const amplitude = 10;
              const frequency = 0.02;
              const speed = 5;
              
              // Draw horizontal strips with offset
              // We cannot do per-pixel in HD fast enough, so we slice
              for (let y = 0; y < drawH; y++) {
                  const offset = Math.sin(y * frequency + elapsed * speed) * amplitude;
                  
                  // Map dest y to source y
                  const sy = (y / drawH) * sourceImage.height;
                  const sH = sourceImage.height / drawH;

                  ctx.drawImage(
                      sourceImage, 
                      0, sy, sourceImage.width, sH, // source
                      offset, y, drawW, 1 // dest
                  );
              }
          } else if (settings.animationMode === AnimationMode.JELLY) {
               const bounceX = Math.sin(elapsed * 3) * 0.02;
               const bounceY = Math.cos(elapsed * 2) * 0.02;
               const rot = Math.sin(elapsed) * 0.02;

               ctx.save();
               ctx.translate(drawW/2, drawH/2);
               ctx.scale(1 + bounceX, 1 + bounceY);
               ctx.rotate(rot);
               ctx.drawImage(sourceImage, -drawW/2, -drawH/2, drawW, drawH);
               ctx.restore();

          } else if (settings.animationMode === AnimationMode.SCANLINE) {
               ctx.drawImage(sourceImage, 0, 0, drawW, drawH);
               
               // Overlay scanline
               const scanY = (elapsed * 200) % drawH;
               ctx.filter = 'none'; // Don't apply contrast to the scanline overlay itself? Actually we want clear overlay
               ctx.fillStyle = 'rgba(255,255,255,0.1)';
               ctx.fillRect(0, scanY, drawW, 10);

               // Random glitch
               if (Math.random() > 0.97) {
                   const h = Math.random() * 50;
                   const y = Math.random() * drawH;
                   const xOff = (Math.random() - 0.5) * 20;
                   ctx.drawImage(canvas, 0, y, drawW, h, xOff, y, drawW, h);
               }

          } else {
               // Static / Matrix fallback
               ctx.drawImage(sourceImage, 0, 0, drawW, drawH);
          }
          
          ctx.filter = 'none';
          animationRef.current = requestAnimationFrame(renderFrame);
          return;
      }

      // --- GRID RENDER PATH (ASCII, BEAD, PIXEL) ---
      
      // Determine dimensions
      const cols = settings.resolution;
      
      // Beads and Pixels are square (using fontSize as side length)
      // ASCII is rectangular (fontSize * 0.6 width)
      const charW = isAscii ? settings.fontSize * 0.6 : settings.fontSize;
      const charH = settings.fontSize;
      
      const aspectRatio = sourceImage.height / sourceImage.width;
      
      // Adjust grid ratio. ASCII needs (charW/charH) to maintain image aspect ratio.
      // Bead/Pixel use 1.0 square ratio.
      const gridRatio = isAscii ? (charW / charH) : 1.0;
      const rows = Math.floor(cols * aspectRatio * gridRatio); 

      // Canvas size (Display)
      const targetWidth = cols * charW;
      const targetHeight = rows * charH;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Resize source image to our grid size (cols x rows)
      offCanvas.width = cols;
      offCanvas.height = rows;
      offCtx.clearRect(0, 0, cols, rows);
      offCtx.drawImage(sourceImage, 0, 0, cols, rows);
      
      const imageData = offCtx.getImageData(0, 0, cols, rows);
      const pixels = imageData.data;

      // Fill Background
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Setup for ASCII
      if (isAscii) {
          ctx.font = `bold ${settings.fontSize}px "JetBrains Mono", monospace`;
          ctx.textBaseline = 'top';
      }
      
      const chars = settings.density;
      const charLen = chars.length;

      // Loop grid
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          
          // Animation Math
          let sampleX = x;
          let sampleY = y;

          if (settings.animationMode === AnimationMode.WAVE) {
            const wave = Math.sin(x * 0.1 + elapsed * 2) * 2;
            sampleY = Math.floor(y + wave);
          } else if (settings.animationMode === AnimationMode.JELLY) {
             const waveX = Math.sin(y * 0.1 + elapsed) * 1.5;
             const waveY = Math.cos(x * 0.1 + elapsed) * 1.5;
             sampleX = Math.floor(x + waveX);
             sampleY = Math.floor(y + waveY);
          } else if (settings.animationMode === AnimationMode.SCANLINE) {
             const scan = Math.floor((elapsed * 10) % rows);
             if (Math.abs(y - scan) < 2) {
               sampleX = Math.floor(x + (Math.random() - 0.5) * 2);
             }
          }

          sampleX = Math.max(0, Math.min(cols - 1, sampleX));
          sampleY = Math.max(0, Math.min(rows - 1, sampleY));

          const pixelIndex = (sampleY * cols + sampleX) * 4;
          let r = pixels[pixelIndex];
          let g = pixels[pixelIndex + 1];
          let b = pixels[pixelIndex + 2];
          
          // Contrast adjustment
          if (settings.contrast !== 1.0) {
             const factor = (259 * (settings.contrast * 255 + 255)) / (255 * (259 - settings.contrast * 255));
             r = factor * (r - 128) + 128;
             g = factor * (g - 128) + 128;
             b = factor * (b - 128) + 128;
          }

          // Invert Colors for Bead/Pixel Mode if needed
          if (settings.invert && !isAscii) {
             r = 255 - r;
             g = 255 - g;
             b = 255 - b;
          }

          if (isBead) {
              // Bead Rendering
              const cx = x * charW + charW / 2;
              const cy = y * charH + charH / 2;
              const radius = (charW / 2) * 0.85; 
              
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();

          } else if (isPixel) {
              // Pixel Rendering
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              // +0.5 to prevent sub-pixel rendering gaps
              ctx.fillRect(x * charW, y * charH, charW + 0.5, charH + 0.5);

          } else {
              // ASCII Rendering
              let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              if (settings.invert) brightness = 1.0 - brightness;

              const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
              let char = chars[charIndex];

              if (settings.animationMode === AnimationMode.MATRIX) {
                const flicker = Math.random() > 0.9 ? 0.5 : 1;
                ctx.globalAlpha = Math.max(0, Math.min(1, brightness * flicker));
                if (Math.random() > 0.95) {
                   char = chars[Math.floor(Math.random() * charLen)];
                }
              } else {
                ctx.globalAlpha = 1;
              }

              if (settings.animationMode === AnimationMode.SCANLINE) {
                 ctx.fillStyle = settings.color;
                 if (Math.random() > 0.98) ctx.fillStyle = '#fff';
              } else {
                 ctx.fillStyle = settings.color;
              }

              ctx.fillText(char, x * charW, y * charH);
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
        style={{ imageRendering: settings.renderMode === RenderMode.HD ? 'auto' : 'pixelated' }}
      />

      {sourceImage && settings.renderMode === RenderMode.ASCII && (
        <button
          onClick={handleCopyAscii}
          className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur border border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium hover:bg-indigo-600 hover:border-indigo-500 transition-all shadow-xl opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Copy text to clipboard"
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Copied!' : 'Copy Text'}
        </button>
      )}
    </div>
  );
};
