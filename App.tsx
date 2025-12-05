import React, { useState, useCallback, useRef } from 'react';
import { AsciiRenderer } from './components/AsciiRenderer';
import { Controls } from './components/Controls';
import { Button } from './components/Button';
import { ChromaKeyModal } from './components/ChromaKeyModal';
import { EvolutionStage } from './components/EvolutionStage';
import { AsciiSettings, AnimationMode, RenderMode } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateAIImage, generateCreativePrompt, removeBackground } from './services/geminiService';
import { Upload, Wand2, Image as ImageIcon, Plus, Trash2, Sparkles, Loader2, Pipette, Layout, Type, Grid, Box, Eraser, Github, Layers, Command, Search, Fingerprint, Disc } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  name: string;
}

const App: React.FC = () => {
  // --- STATE ---
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<AsciiSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  
  // UI Flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSuperKeyOpen, setIsSuperKeyOpen] = useState(false);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dockInputRef = useRef<HTMLInputElement>(null);

  const activeImage = gallery.find(img => img.id === activeId);

  // --- HANDLERS ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (dockInputRef.current) dockInputRef.current.value = '';
  };

  const processFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
        const timestamp = Date.now();
        const newItems: GalleryItem[] = Array.from(files).map((file: File, index) => ({
          id: `img-${timestamp}-${index}-${Math.random().toString(36).substring(2, 9)}`,
          url: URL.createObjectURL(file),
          name: file.name
        }));
        setGallery(prev => [...prev, ...newItems]);
        if (!activeId && newItems.length > 0) setActiveId(newItems[0].id);
      }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleGenerateImage = useCallback(async () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    try {
      const base64Image = await generateAIImage(promptInput);
      const newItem: GalleryItem = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: base64Image,
          name: `AI_${promptInput.slice(0, 6).toUpperCase()}`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
    } catch (error) { alert("Generation failed."); } finally { setIsGenerating(false); }
  }, [promptInput]);

  const handleRemoveBackground = useCallback(async () => {
    if (!activeImage) return;
    setIsRemovingBg(true);
    try {
      const newBase64 = await removeBackground(activeImage.url);
      const newItem: GalleryItem = {
        id: `rembg-${Date.now()}`,
        url: newBase64,
        name: `NOBG_${activeImage.name}`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
    } catch (error) { alert("Background removal failed."); } finally { setIsRemovingBg(false); }
  }, [activeImage]);

  const handleSuperKeySave = (newBase64: string) => {
      const newItem: GalleryItem = {
          id: `superkey-${Date.now()}`,
          url: newBase64,
          name: `KEY_${activeImage?.name || 'IMG'}`
      };
      setGallery(prev => [...prev, newItem]);
      setActiveId(newItem.id);
      setIsSuperKeyOpen(false);
  };

  // Undo/Redo System
  const handleSettingsUpdate = (newSettings: AsciiSettings) => setSettings(newSettings);
  const handleCommit = (settingsToCommit: AsciiSettings) => {
    if (JSON.stringify(history[historyIndex]) === JSON.stringify(settingsToCommit)) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(settingsToCommit);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const handleUndo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setSettings(history[historyIndex - 1]); } };
  const handleRedo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setSettings(history[historyIndex + 1]); } };

  const removeImage = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newGallery = gallery.filter(i => i.id !== id);
      setGallery(newGallery);
      if (activeId === id) setActiveId(newGallery.length ? newGallery[newGallery.length-1].id : null);
  };

  return (
    <div 
        className="flex h-screen w-screen overflow-hidden bg-void text-zinc-300 font-sans selection:bg-cyan-500/20"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* --- OVERLAYS --- */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-cyan-950/20 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/50 m-4 border-dashed animate-pulse">
            <div className="text-cyan-400 font-mono text-xl tracking-widest uppercase font-bold">
                [ DROP_MEDIA_TO_IMPORT ]
            </div>
        </div>
      )}

      <ChromaKeyModal isOpen={isSuperKeyOpen} onClose={() => setIsSuperKeyOpen(false)} imageSrc={activeImage?.url || null} onSave={handleSuperKeySave} />
      {isEvolutionOpen && activeImage && (
          <EvolutionStage imageSrc={activeImage.url} baseSettings={settings} onSave={(s) => { setSettings({...settings, motionScript: s, animationMode: AnimationMode.PARTICLES}); setIsEvolutionOpen(false); }} onCancel={() => setIsEvolutionOpen(false)} />
      )}

      {/* =====================================================================================
          STATION LAYOUT (GRID)
      ===================================================================================== */}
      
      {/* 1. LEFT SIDEBAR (Activity Bar) */}
      <aside className="w-16 border-r border-zinc-900 bg-[#050505] flex flex-col items-center py-4 z-30 gap-6">
          <div className="w-10 h-10 flex items-center justify-center text-cyan-400 mb-2 border border-cyan-900/30 bg-cyan-950/10 clip-corner">
              <Disc size={20} className="animate-spin-slow" />
          </div>

          {[
            { mode: RenderMode.ASCII, icon: <Type size={20} />, label: 'TXT' },
            { mode: RenderMode.BEAD, icon: <Grid size={20} />, label: 'DOT' },
            { mode: RenderMode.PIXEL, icon: <Layout size={20} />, label: 'PIX' },
            { mode: RenderMode.MINECRAFT, icon: <Box size={20} />, label: 'VOX' },
          ].map((m) => (
              <button
                key={m.mode}
                onClick={() => {
                    const s = {...settings, renderMode: m.mode};
                    setSettings(s);
                    handleCommit(s);
                }}
                className={`w-10 h-10 flex items-center justify-center transition-all group relative ${settings.renderMode === m.mode ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-300'}`}
                title={m.label}
              >
                  {m.icon}
                  {settings.renderMode === m.mode && (
                      <>
                        <div className="absolute inset-0 border border-cyan-500/30 bg-cyan-500/5 clip-corner"/>
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-cyan-500"/>
                      </>
                  )}
              </button>
          ))}
          
          <div className="mt-auto mb-2 opacity-50 hover:opacity-100 transition-opacity">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-700 hover:text-white transition-colors">
                  <Github size={20} />
              </a>
          </div>
      </aside>

      {/* 2. LEFT PANEL (Project / Assets) */}
      <section className="w-80 border-r border-zinc-900 bg-[#08080a] flex flex-col z-20">
           {/* Header */}
           <div className="h-10 border-b border-zinc-900 flex items-center px-4 gap-2 bg-[#050505]">
                <Command size={12} className="text-cyan-600"/>
                <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 font-mono">GENERATOR_MODULE</span>
           </div>

           {/* Generator */}
           <div className="p-5 border-b border-zinc-900/50">
               <div className="relative mb-4 group">
                    <textarea 
                        className="w-full bg-black border border-zinc-800 p-3 text-xs text-cyan-500 placeholder:text-zinc-700 focus:border-cyan-600 focus:ring-0 outline-none resize-none h-24 font-mono tracking-wide"
                        placeholder="INPUT_PROMPT..."
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerateImage())}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                             onClick={async () => setPromptInput(await generateCreativePrompt())}
                             className="p-1.5 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                             title="Randomize"
                        >
                            <Fingerprint size={12}/>
                        </button>
                    </div>
               </div>
               <Button 
                    variant="primary" 
                    className="w-full py-3" 
                    onClick={handleGenerateImage} 
                    isLoading={isGenerating}
                    icon={<Wand2 size={12} />}
                >
                    INIT_GENERATION
               </Button>
           </div>

           {/* Tools */}
           <div className="p-5 border-b border-zinc-900/50 space-y-3">
               <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1 font-mono pl-1 border-l-2 border-cyan-900">Process Image</h3>
                <div className="grid grid-cols-1 gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm"
                        className="w-full justify-start text-[9px] font-mono h-9 border-zinc-800 bg-zinc-900/50"
                        disabled={!activeImage || isRemovingBg}
                        onClick={handleRemoveBackground}
                        icon={isRemovingBg ? <Loader2 size={12} className="animate-spin"/> : <Eraser size={12} className="text-violet-400"/>}
                    >
                        AI_REMOVE_BACKGROUND
                    </Button>
                    <Button 
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start text-[9px] font-mono h-9 border-zinc-800 bg-zinc-900/50"
                        disabled={!activeImage}
                        onClick={() => setIsSuperKeyOpen(true)}
                        icon={<Pipette size={12} className="text-emerald-400"/>}
                    >
                        MANUAL_CHROMA_KEY
                    </Button>
                </div>
           </div>
           
           {/* Gallery List */}
           <div className="flex-1 overflow-y-auto bg-[#030303] relative">
               <div className="sticky top-0 bg-[#08080a]/90 backdrop-blur border-b border-zinc-900 p-2 z-10 flex justify-between items-center">
                   <span className="text-[9px] font-mono text-zinc-500 tracking-wider">PROJECT_FILES</span>
                   <span className="text-[9px] font-mono text-cyan-900">{gallery.length} ITEMS</span>
               </div>
               
               <div className="p-2 grid grid-cols-2 gap-2">
                   {gallery.map((item) => (
                       <div 
                         key={item.id}
                         onClick={() => setActiveId(item.id)}
                         className={`relative aspect-square border cursor-pointer group transition-all duration-300 ${activeId === item.id ? 'border-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'}`}
                       >
                           <img src={item.url} alt="asset" className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 bg-black/90 p-1.5 truncate text-[8px] font-mono text-zinc-400 uppercase tracking-tight">
                               {item.name}
                           </div>
                           <button onClick={(e) => removeImage(e, item.id)} className="absolute top-0 right-0 bg-red-900/80 text-white p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all clip-corner">
                               <Trash2 size={10} />
                           </button>
                           {/* Active Marker */}
                           {activeId === item.id && <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-500 clip-corner"></div>}
                       </div>
                   ))}
                    <label className="aspect-square border border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-900/5 cursor-pointer flex flex-col items-center justify-center text-zinc-700 hover:text-cyan-400 transition-all gap-2 group">
                       <Plus size={24} className="group-hover:scale-110 transition-transform" />
                       <span className="text-[8px] uppercase font-bold tracking-widest">Import</span>
                       <input ref={dockInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
               </div>
           </div>
           
           {/* Footer Stats */}
           <div className="h-8 border-t border-zinc-900 bg-[#050505] flex items-center justify-between px-3 text-[9px] font-mono text-zinc-600">
               <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> ONLINE</span>
               <span>MEM: {Math.floor(Math.random() * 40 + 20)}%</span>
           </div>
      </section>

      {/* 3. CENTER: VIEWPORT */}
      <main className="flex-1 relative flex flex-col bg-[#030303] overflow-hidden">
          
          {/* Viewport Header */}
          <div className="h-10 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#030303]">
               <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest">
                   <span className="text-cyan-500 font-bold">VIEWPORT_MAIN</span>
                   <span className="text-zinc-700">|</span>
                   <span className="text-zinc-500">RES: {settings.resolution}PX</span>
                   <span className="text-zinc-700">|</span>
                   <span className="text-zinc-500">MODE: {settings.renderMode}</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-mono">
                       {settings.animationMode === AnimationMode.STATIC ? 'STATIC' : 'LIVE'}
                   </div>
               </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-grid-pattern group">
               
               {/* --- HUD OVERLAYS --- */}
               
               {/* Corners */}
               <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-cyan-500/30 pointer-events-none transition-all group-hover:border-cyan-500/80 group-hover:w-12 group-hover:h-12"/>
               <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-cyan-500/30 pointer-events-none transition-all group-hover:border-cyan-500/80 group-hover:w-12 group-hover:h-12"/>
               <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30 pointer-events-none transition-all group-hover:border-cyan-500/80 group-hover:w-12 group-hover:h-12"/>
               <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-cyan-500/30 pointer-events-none transition-all group-hover:border-cyan-500/80 group-hover:w-12 group-hover:h-12"/>
               
               {/* Center Crosshair */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity">
                    <div className="w-[1px] h-20 bg-cyan-500"/>
                    <div className="h-[1px] w-20 bg-cyan-500 absolute"/>
                    <div className="w-12 h-12 border border-cyan-500 rounded-full absolute opacity-50"/>
               </div>

               {/* Rulers (Fake) */}
               <div className="absolute top-0 inset-x-0 h-4 border-b border-zinc-900 bg-[#030303]/80 flex justify-between px-2 opacity-50">
                    {[...Array(20)].map((_,i) => <div key={i} className="w-[1px] h-full bg-zinc-800"/>)}
               </div>
               <div className="absolute left-0 inset-y-0 w-4 border-r border-zinc-900 bg-[#030303]/80 flex flex-col justify-between py-2 opacity-50">
                    {[...Array(20)].map((_,i) => <div key={i} className="h-[1px] w-full bg-zinc-800"/>)}
               </div>


               {activeImage ? (
                   <div className="relative z-10 p-12 w-full h-full flex flex-col">
                       <div className="flex-1 relative flex items-center justify-center">
                           {/* The Renderer */}
                           <div className="border border-zinc-800/50 bg-black/20 backdrop-blur-[1px]">
                               <AsciiRenderer imageSrc={activeImage.url} settings={settings} />
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="text-center space-y-4 opacity-20 select-none pointer-events-none flex flex-col items-center animate-pulse">
                       <div className="w-32 h-32 border border-dashed border-zinc-500 flex items-center justify-center rounded-full">
                          <ImageIcon size={48} className="text-zinc-500" />
                       </div>
                       <h1 className="text-sm font-mono text-zinc-500 tracking-[0.5em] uppercase">NO_SIGNAL</h1>
                   </div>
               )}
          </div>
      </main>

      {/* 4. RIGHT PANEL: INSPECTOR */}
      <aside className="w-80 border-l border-zinc-900 bg-[#08080a] z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <Controls 
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onCommit={handleCommit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onOpenEvolution={() => setIsEvolutionOpen(true)}
          />
      </aside>

    </div>
  );
};

export default App;