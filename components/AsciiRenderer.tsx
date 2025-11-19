import React, { useRef, useEffect, useState } from 'react';
import { AsciiSettings, AnimationMode } from '../types';
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
    if (!sourceImage) return;

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
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency if possible
    if (!ctx) return;

    // Create offscreen canvas for pixel reading
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads
    
    if (!offCtx) return;

    let startTime = Date.now();
    
    const renderFrame = () => {
      const now = Date.now();
      const elapsed = (now - startTime) * 0.001 * settings.animationSpeed;

      // Determine dimensions
      // Resolution setting determines the number of columns
      const cols = settings.resolution;
      const charW = settings.fontSize * 0.6; // Approximate aspect ratio for mono font
      const charH = settings.fontSize;
      
      const aspectRatio = sourceImage.height / sourceImage.width;
      const rows = Math.floor(cols * aspectRatio * (charW / charH)); // Adjust for char aspect ratio

      // Canvas size (Display)
      const targetWidth = cols * charW;
      const targetHeight = rows * charH;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Resize source image to our grid size (cols x rows) for easier color sampling
      offCanvas.width = cols;
      offCanvas.height = rows;
      
      // Draw image to offscreen context
      // Clear offscreen
      offCtx.clearRect(0, 0, cols, rows);
      
      // Apply contrast filter directly to source if possible, or manual math later
      // Using manual math for control
      offCtx.drawImage(sourceImage, 0, 0, cols, rows);
      
      const imageData = offCtx.getImageData(0, 0, cols, rows);
      const pixels = imageData.data;

      // Fill Background
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Set Font
      ctx.font = `bold ${settings.fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      
      // Pre-calculate chars
      const chars = settings.density;
      const charLen = chars.length;

      // Loop grid
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          
          // Animation Math
          let sampleX = x;
          let sampleY = y;

          // Apply Distortions based on mode
          if (settings.animationMode === AnimationMode.WAVE) {
            const wave = Math.sin(x * 0.1 + elapsed * 2) * 2;
            sampleY = Math.floor(y + wave);
          } else if (settings.animationMode === AnimationMode.JELLY) {
             const waveX = Math.sin(y * 0.1 + elapsed) * 1.5;
             const waveY = Math.cos(x * 0.1 + elapsed) * 1.5;
             sampleX = Math.floor(x + waveX);
             sampleY = Math.floor(y + waveY);
          } else if (settings.animationMode === AnimationMode.SCANLINE) {
             // Scanline scrolling effect
             const scan = Math.floor((elapsed * 10) % rows);
             if (Math.abs(y - scan) < 2) {
               sampleX = Math.floor(x + (Math.random() - 0.5) * 2);
             }
          }

          // Clamping
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

          // Grayscale conversion
          let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (settings.invert) brightness = 1.0 - brightness;

          // Map to char
          // Ensure index is within bounds
          const charIndex = Math.floor(Math.max(0, Math.min(1, brightness)) * (charLen - 1));
          let char = chars[charIndex];

          // Matrix Mode Specifics: Random character switching for active "rain" columns would be cool,
          // but for simple "image to matrix" let's just flicker brighter chars.
          if (settings.animationMode === AnimationMode.MATRIX) {
            // Green color is handled by fillStyle, but let's vary brightness
            const flicker = Math.random() > 0.9 ? 0.5 : 1;
            ctx.globalAlpha = Math.max(0, Math.min(1, brightness * flicker));
            // Occasionally swap char
            if (Math.random() > 0.95) {
               char = chars[Math.floor(Math.random() * charLen)];
            }
          } else {
            ctx.globalAlpha = 1;
          }

          // Color Handling
          if (settings.animationMode === AnimationMode.SCANLINE) {
             // RGB shift
             ctx.fillStyle = settings.color;
             if (Math.random() > 0.98) ctx.fillStyle = '#fff';
          } else {
             ctx.fillStyle = settings.color;
          }

          // Draw Char
          ctx.fillText(char, x * charW, y * charH);
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
        style={{ imageRendering: 'pixelated' }}
      />

      {sourceImage && (
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