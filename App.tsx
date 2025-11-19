import React, { useState, useCallback, useRef } from 'react';
import { AsciiRenderer } from './components/AsciiRenderer';
import { Controls } from './components/Controls';
import { Button } from './components/Button';
import { AsciiSettings, AnimationMode } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateAIImage, generateCreativePrompt } from './services/geminiService';
import { Upload, Wand2, Image as ImageIcon, Info, X } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleGenerateImage = useCallback(async () => {
    if (!promptInput.trim()) return;
    
    setIsGenerating(true);
    try {
      const base64Image = await generateAIImage(promptInput);
      setImage(base64Image);
    } catch (error) {
      alert("Failed to generate image. Check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [promptInput]);

  const handleSurpriseMe = async () => {
      setIsPromptLoading(true);
      try {
          const creativePrompt = await generateCreativePrompt();
          setPromptInput(creativePrompt);
      } catch(e) {
          setPromptInput("A cyberpunk skull glitching in neon rain");
      } finally {
          setIsPromptLoading(false);
      }
  }

  const clearImage = () => {
    setImage(null);
    setPromptInput("");
  };

  return (
    <div 
        className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-white font-sans selection:bg-indigo-500/30"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-4 border-dashed border-indigo-500 m-4 rounded-3xl flex items-center justify-center pointer-events-none">
            <div className="bg-zinc-900/90 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                <Upload size={48} className="text-indigo-400 animate-bounce" />
                <h2 className="text-2xl font-bold text-white">Drop Image Here</h2>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 cursor-pointer" onClick={clearImage}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <span className="font-mono font-bold text-lg">A</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden sm:block">ASCII Motion Art</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {image && (
                <button 
                    onClick={clearImage}
                    className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-2"
                >
                    <X size={14} />
                    Clear
                </button>
            )}
            <label className="cursor-pointer group relative">
               <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
               <div className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-zinc-700">
                  <Upload size={16} />
                  <span>Upload</span>
               </div>
            </label>
          </div>
        </header>

        {/* Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#050505] p-4">
            {/* Grid Background Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />
            
            {image ? (
               <AsciiRenderer imageSrc={image} settings={settings} />
            ) : (
               <div className="text-center max-w-md z-10 w-full mx-auto animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl mx-auto mb-8 flex items-center justify-center border border-zinc-800 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm">
                    <ImageIcon size={40} className="text-indigo-500" />
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">
                    Create ASCII Art
                  </h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed text-sm max-w-xs mx-auto">
                    Upload your own image or generate one with AI. Watch it come to life with ASCII animation.
                  </p>
                  
                  {/* AI Generation Box */}
                  <div className="bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-2xl flex flex-col gap-2 shadow-xl mb-8">
                     <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Describe an image (e.g., 'A neon robot')"
                            className="w-full bg-transparent text-sm p-3 pr-24 outline-none text-white placeholder:text-zinc-600 rounded-xl focus:bg-zinc-800/50 transition-colors"
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateImage()}
                        />
                        <button 
                            onClick={handleSurpriseMe}
                            disabled={isPromptLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all px-2 py-1 rounded-md flex items-center gap-1"
                        >
                            <Wand2 size={10} />
                            {isPromptLoading ? 'Thinking...' : 'Surprise Me'}
                        </button>
                     </div>
                     <Button 
                        onClick={handleGenerateImage} 
                        disabled={isGenerating || !promptInput}
                        isLoading={isGenerating}
                        className="w-full rounded-xl"
                     >
                        Generate & Convert
                     </Button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-8 opacity-50">
                     <div className="h-px bg-zinc-700 flex-1"></div>
                     <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">OR</span>
                     <div className="h-px bg-zinc-700 flex-1"></div>
                  </div>

                  {/* Manual Upload Area */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-4 py-5 rounded-2xl border border-dashed border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-800/30 transition-all group bg-zinc-900/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                        <Upload size={20} className="text-zinc-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-semibold text-zinc-200 group-hover:text-white">Upload Local Image</div>
                        <div className="text-xs text-zinc-500 group-hover:text-zinc-400 mt-0.5">Support JPG, PNG, WEBP</div>
                    </div>
                  </button>
                  
                  {/* Hidden Input for Center Button */}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />

               </div>
            )}
        </div>
      </main>

      {/* Sidebar */}
      <aside className="hidden md:block h-full border-l border-zinc-800 relative z-20 shadow-xl w-80 flex-shrink-0">
         <Controls settings={settings} onUpdate={setSettings} />
      </aside>
      
    </div>
  );
};

export default App;