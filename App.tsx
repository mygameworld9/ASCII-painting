import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AsciiRenderer } from './components/AsciiRenderer';
import { Controls } from './components/Controls';
import { Button } from './components/Button';
import { ChromaKeyModal } from './components/ChromaKeyModal';
import { AsciiSettings, AnimationMode } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateAIImage, generateCreativePrompt, removeBackground } from './services/geminiService';
import { Upload, Wand2, Image as ImageIcon, Info, X, Plus, Trash2, Sparkles, Loader2, Pipette } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  name: string;
}

const App: React.FC = () => {
  // Gallery State
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<AsciiSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSuperKeyOpen, setIsSuperKeyOpen] = useState(false);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const activeImage = gallery.find(img => img.id === activeId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const timestamp = Date.now();
      const newItems: GalleryItem[] = Array.from(files).map((file: File, index) => ({
        // Ensure unique ID by combining timestamp, index and random string
        id: `img-${timestamp}-${index}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      
      setGallery(prev => [...prev, ...newItems]);
      // If no active image, select the first new one. 
      // If there is an active image, we let the user stay on it (or we could switch to the last uploaded).
      if (!activeId && newItems.length > 0) {
        setActiveId(newItems[0].id);
      }
    }
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
       const timestamp = Date.now();
       const newItems: GalleryItem[] = [];
       Array.from(files).forEach((file: File, index) => {
         if (file.type.startsWith('image/')) {
             newItems.push({
               id: `drop-${timestamp}-${index}-${Math.random().toString(36).substring(2, 9)}`,
               url: URL.createObjectURL(file),
               name: file.name
             });
         }
       });

       if (newItems.length > 0) {
         setGallery(prev => [...prev, ...newItems]);
         if (!activeId) setActiveId(newItems[0].id);
       }
    }
  };

  const handleGenerateImage = useCallback(async () => {
    if (!promptInput.trim()) return;
    
    setIsGenerating(true);
    try {
      const base64Image = await generateAIImage(promptInput);
      const newItem: GalleryItem = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: base64Image,
          name: `AI-${promptInput.slice(0, 10)}.jpg`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
    } catch (error) {
      alert("Failed to generate image. Check API Key or try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [promptInput]);

  const handleRemoveBackground = useCallback(async () => {
    if (!activeImage) return;
    
    setIsRemovingBg(true);
    try {
      const newBase64 = await removeBackground(activeImage.url);
      const newItem: GalleryItem = {
        id: `rembg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: newBase64,
        name: `NoBG-${activeImage.name}`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
    } catch (error) {
      console.error("Remove BG failed", error);
      alert("Failed to remove background. Ensure API key is valid.");
    } finally {
      setIsRemovingBg(false);
    }
  }, [activeImage]);

  const handleSuperKeySave = (newBase64: string) => {
      if (!activeImage) return;
      const newItem: GalleryItem = {
          id: `superkey-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: newBase64,
          name: `Keyed-${activeImage.name}`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
      setIsSuperKeyOpen(false);
  };

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

  const clearGallery = () => {
    setGallery([]);
    setActiveId(null);
    setPromptInput("");
  };

  const removeImage = (e: React.MouseEvent, idToRemove: string) => {
      e.stopPropagation();
      
      // Correct way to update state that depends on another state:
      // 1. Calculate the new gallery
      const newGallery = gallery.filter(item => item.id !== idToRemove);
      
      // 2. Set the gallery
      setGallery(newGallery);
      
      // 3. If we removed the active image, update activeId based on the NEW gallery
      if (activeId === idToRemove) {
          setActiveId(newGallery.length > 0 ? newGallery[newGallery.length - 1].id : null);
      }
  };

  // Settings Management
  const handleSettingsUpdate = (newSettings: AsciiSettings) => {
    setSettings(newSettings);
  };

  const handleCommit = (settingsToCommit: AsciiSettings) => {
    // Prevent duplicates
    if (JSON.stringify(history[historyIndex]) === JSON.stringify(settingsToCommit)) {
        return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(settingsToCommit);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setSettings(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setSettings(history[newIndex]);
    }
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
                <h2 className="text-2xl font-bold text-white">Drop Images Here</h2>
                <p className="text-zinc-400">Add to Batch Gallery</p>
            </div>
        </div>
      )}

      <ChromaKeyModal 
        isOpen={isSuperKeyOpen}
        onClose={() => setIsSuperKeyOpen(false)}
        imageSrc={activeImage?.url || null}
        onSave={handleSuperKeySave}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={clearGallery}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <span className="font-mono font-bold text-lg">A</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden sm:block">ASCII Motion Art</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {activeImage && (
                <>
                <button
                    onClick={() => setIsSuperKeyOpen(true)}
                    className="text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-all flex items-center gap-2 border border-zinc-700"
                    title="Manual Background Removal (Chroma Key)"
                >
                    <Pipette size={14} className="text-emerald-400"/>
                    <span className="hidden sm:inline">Super Key</span>
                </button>

                <button
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg}
                    className="text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-3 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 border border-white/10"
                    title="Use AI to remove background"
                >
                    {isRemovingBg ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                    <span className="hidden sm:inline">Magic Remove</span>
                </button>
                </>
            )}

            {gallery.length > 0 && (
                <button 
                    onClick={clearGallery}
                    className="text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-2"
                >
                    <Trash2 size={14} />
                    Clear All
                </button>
            )}
            <label className="cursor-pointer group relative">
               <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileUpload} 
                    className="hidden" 
               />
               <div className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-zinc-700">
                  <Plus size={16} />
                  <span>Upload Images</span>
               </div>
            </label>
          </div>
        </header>

        {/* Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#050505] p-4">
            {/* Grid Background Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />
            
            {activeImage ? (
               <div className="w-full h-full flex flex-col relative z-10">
                   {/* Renderer */}
                   <div className="flex-1 min-h-0 pb-4">
                        <AsciiRenderer imageSrc={activeImage.url} settings={settings} />
                   </div>
               </div>
            ) : (
               <div className="text-center max-w-md z-10 w-full mx-auto animate-in fade-in zoom-in duration-300 pb-20">
                  <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl mx-auto mb-8 flex items-center justify-center border border-zinc-800 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm">
                    <ImageIcon size={40} className="text-indigo-500" />
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">
                    Batch Design Studio
                  </h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed text-sm max-w-xs mx-auto">
                    Upload multiple images to design in batch, or generate one with AI.
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
               </div>
            )}
        </div>

        {/* Gallery Strip */}
        {gallery.length > 0 && (
             <div className="h-24 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 px-4 overflow-x-auto flex-shrink-0 z-20">
                 {gallery.map((item) => (
                     <div 
                        key={item.id} 
                        onClick={() => setActiveId(item.id)}
                        className={`relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            activeId === item.id 
                            ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-105' 
                            : 'border-zinc-700 hover:border-zinc-500 opacity-70 hover:opacity-100'
                        }`}
                     >
                         <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                         <button 
                            onClick={(e) => removeImage(e, item.id)}
                            className="absolute top-0 right-0 bg-black/60 p-0.5 rounded-bl text-zinc-300 hover:text-red-400 hover:bg-black opacity-0 group-hover:opacity-100 transition-all"
                         >
                             <X size={10} />
                         </button>
                     </div>
                 ))}
                 
                 {/* Add Button in Strip */}
                 <label className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-800 cursor-pointer flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-indigo-400 transition-all">
                     <Plus size={16} />
                     <span className="text-[8px] font-bold uppercase">Add</span>
                     <input 
                        ref={galleryInputRef}
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="hidden" 
                   />
                 </label>
             </div>
        )}
      </main>

      {/* Sidebar */}
      <aside className="hidden md:block h-full border-l border-zinc-800 relative z-20 shadow-xl w-80 flex-shrink-0">
         <Controls 
            settings={settings} 
            onUpdate={handleSettingsUpdate} 
            onCommit={handleCommit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
         />
      </aside>
      
    </div>
  );
};

export default App;