import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Pipette, Sliders, Undo2, Loader2, MousePointer2, Crop, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface ChromaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onSave: (result: string) => void;
}

type ToolMode = 'none' | 'picker' | 'crop';

export const ChromaKeyModal: React.FC<ChromaKeyModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  
  // State
  const [tool, setTool] = useState<ToolMode>('picker');
  const [keyColor, setKeyColor] = useState<[number, number, number]>([0, 255, 0]); // Default Green
  const [tolerance, setTolerance] = useState(30); // 0-100
  const [softness, setSoftness] = useState(10); // 0-100
  const [isLoading, setIsLoading] = useState(true);

  // Crop State
  const [cropRect, setCropRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  // Load Image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setSourceImage(img);
      setIsLoading(false);
      setTool('picker');
      setCropRect(null);
    };
    img.onerror = () => {
        setIsLoading(false);
        console.error("Failed to load image for Chroma Key");
    };
  }, [isOpen, imageSrc]);

  // Render Loop
  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Reset canvas size to match image
    if (canvas.width !== sourceImage.width || canvas.height !== sourceImage.height) {
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
    }

    // 1. Draw Original
    ctx.drawImage(sourceImage, 0, 0);

    // 2. Apply Chroma Key Filter
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const [kr, kg, kb] = keyColor;
    
    const thresh = tolerance * 4.4; 
    const soft = softness * 2.0; 

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance
        const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);

        if (dist < thresh) {
            data[i + 3] = 0; // Transparent
        } else if (dist < thresh + soft) {
            // Feather edge
            const alpha = (dist - thresh) / (soft || 0.1); 
            data[i + 3] = Math.floor(data[i+3] * alpha);
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // 3. Draw Crop Overlay
    if (cropRect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        // Draw 4 rectangles around the crop area to dim the outside
        // Top
        ctx.fillRect(0, 0, canvas.width, cropRect.y);
        // Bottom
        ctx.fillRect(0, cropRect.y + cropRect.h, canvas.width, canvas.height - (cropRect.y + cropRect.h));
        // Left
        ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h);
        // Right
        ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, canvas.width - (cropRect.x + cropRect.w), cropRect.h);

        // Border
        ctx.strokeStyle = '#00f3ff'; // Cyber color
        ctx.lineWidth = 2;
        ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    }

  }, [sourceImage, keyColor, tolerance, softness, cropRect]);

  const getCanvasCoordinates = (e: React.MouseEvent) => {
      if (!canvasRef.current || !sourceImage) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = sourceImage.width / rect.width;
      const scaleY = sourceImage.height / rect.height;
      return {
          x: Math.floor((e.clientX - rect.left) * scaleX),
          y: Math.floor((e.clientY - rect.top) * scaleY)
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      if (tool === 'picker') {
          // Pick Color Logic
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
             // We need to sample from the ORIGINAL image, not the filtered canvas
             // Since we don't have a separate offscreen canvas easily accessible here 
             // without refs, we can rely on the fact that we clear/redraw every render.
             // BUT, the canvas currently shows the FILTERED image.
             // To get the true color, we should draw sourceImage to a temp context or calculate.
             // Simpler: Draw source image momentarily? No, that causes flicker.
             // Create temp canvas for picking.
             const tempCanvas = document.createElement('canvas');
             tempCanvas.width = 1; tempCanvas.height = 1;
             const tempCtx = tempCanvas.getContext('2d');
             if (tempCtx && sourceImage) {
                 tempCtx.drawImage(sourceImage, coords.x, coords.y, 1, 1, 0, 0, 1, 1);
                 const p = tempCtx.getImageData(0,0,1,1).data;
                 setKeyColor([p[0], p[1], p[2]]);
             }
          }
      } else if (tool === 'crop') {
          setIsDragging(true);
          setDragStart(coords);
          setCropRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !dragStart || tool !== 'crop') return;
      
      const coords = getCanvasCoordinates(e);
      if (!coords) return;

      const newW = coords.x - dragStart.x;
      const newH = coords.y - dragStart.y;

      // Handle negative width/height (dragging left/up)
      let finalX = dragStart.x;
      let finalY = dragStart.y;
      let finalW = Math.abs(newW);
      let finalH = Math.abs(newH);

      if (newW < 0) finalX = coords.x;
      if (newH < 0) finalY = coords.y;

      setCropRect({ x: finalX, y: finalY, w: finalW, h: finalH });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
  };

  const handleSave = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      
      if (cropRect && cropRect.w > 0 && cropRect.h > 0) {
          // Crop Mode
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = cropRect.w;
          tempCanvas.height = cropRect.h;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
              const ctx = canvas.getContext('2d');
              // We grab from the CURRENT canvas which has the filter applied
              if (ctx) {
                  const data = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
                  tempCtx.putImageData(data, 0, 0);
                  onSave(tempCanvas.toDataURL('image/png'));
              }
          }
      } else {
          // Full Image Mode
          onSave(canvas.toDataURL('image/png'));
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Pipette size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Super Key Editor</h2>
                    <p className="text-xs text-zinc-400">Remove background & Crop</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Canvas Area */}
            <div className="flex-1 bg-[#101012] relative flex items-center justify-center p-8 overflow-auto select-none">
                {/* Checkerboard bg for transparency */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#1f1f22_25%,transparent_25%,transparent_75%,#1f1f22_75%,#1f1f22),linear-gradient(45deg,#1f1f22_25%,transparent_25%,transparent_75%,#1f1f22_75%,#1f1f22)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-30 pointer-events-none" />
                
                {isLoading && <Loader2 className="animate-spin text-indigo-500 absolute" size={48} />}
                
                <canvas 
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`max-w-full max-h-full object-contain shadow-2xl border border-zinc-800 
                        ${tool === 'picker' ? 'cursor-crosshair' : ''} 
                        ${tool === 'crop' ? 'cursor-move' : ''}
                    `}
                />
            </div>

            {/* Sidebar Controls */}
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto">
                
                {/* TOOL TOGGLE */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-800 p-1 rounded-xl">
                    <button
                        onClick={() => setTool('picker')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            tool === 'picker' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Pipette size={14} /> Color Picker
                    </button>
                    <button
                        onClick={() => setTool('crop')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            tool === 'crop' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Crop size={14} /> Crop / Cut
                    </button>
                </div>

                {/* 1. Key Color Controls */}
                <div className={`space-y-4 transition-opacity ${tool !== 'picker' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chroma Key</label>
                    
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-lg border-2 border-zinc-700 shadow-inner"
                            style={{ backgroundColor: `rgb(${keyColor[0]}, ${keyColor[1]}, ${keyColor[2]})` }}
                        />
                        <div className="flex-1">
                            <div className="text-xs text-zinc-300">Selected Color</div>
                            <div className="text-[10px] text-zinc-500 font-mono">RGB: {keyColor.join(', ')}</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-300">Tolerance</label>
                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{tolerance}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={tolerance}
                            onChange={(e) => setTolerance(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-300">Softness</label>
                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{softness}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={softness}
                            onChange={(e) => setSoftness(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>

                <div className="w-full h-px bg-zinc-800" />

                {/* 2. Crop Controls */}
                <div className={`space-y-3 transition-opacity ${tool !== 'crop' ? 'opacity-50 pointer-events-none' : ''}`}>
                     <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Crop Area</label>
                        {cropRect && (
                            <button 
                                onClick={() => setCropRect(null)}
                                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 size={10} /> Clear Crop
                            </button>
                        )}
                     </div>
                     <p className="text-xs text-zinc-400 leading-relaxed">
                        Drag on the image to select the area you want to keep. Everything outside the box will be removed.
                     </p>
                </div>

                <div className="mt-auto pt-6 space-y-3">
                    <Button 
                        onClick={handleSave} 
                        className="w-full h-12 text-base shadow-xl shadow-indigo-500/20"
                        icon={<Check size={18} />}
                    >
                        {cropRect ? 'Save Cropped Selection' : 'Save Image'}
                    </Button>
                    <Button 
                        variant="secondary"
                        onClick={() => {
                            setTolerance(30);
                            setSoftness(10);
                            setKeyColor([0,255,0]);
                            setCropRect(null);
                            setTool('picker');
                        }} 
                        className="w-full"
                        icon={<Undo2 size={16} />}
                    >
                        Reset All
                    </Button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};