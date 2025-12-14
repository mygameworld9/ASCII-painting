
import React, { useState, useRef } from 'react';
import { AsciiRenderer } from './components/AsciiRenderer';
import { Controls } from './components/Controls';
import { Button } from './components/Button';
import { ChromaKeyModal } from './components/ChromaKeyModal';
import { EvolutionStage } from './components/EvolutionStage';
import { AsciiSettings, AnimationMode, RenderMode, Language, GalleryItem } from './types';
import { DEFAULT_SETTINGS, TRANSLATIONS } from './constants';
import { removeBackground } from './services/geminiService';
import { Image as ImageIcon, Github, Disc } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<AsciiSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [settings, setSettings] = useState<AsciiSettings>(DEFAULT_SETTINGS);
  
  // UI Flags
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSuperKeyOpen, setIsSuperKeyOpen] = useState(false);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Language State
  const [language, setLanguage] = useState<Language>('zh');

  const activeImage = gallery.find(img => img.id === activeId);
  const t = TRANSLATIONS[language];

  // --- HANDLERS ---
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

  const handleRemoveBackground = async () => {
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
  };

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

  const removeImage = (id: string) => {
      const newGallery = gallery.filter(i => i.id !== id);
      setGallery(newGallery);
      if (activeId === id) setActiveId(newGallery.length ? newGallery[newGallery.length-1].id : null);
  };

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'en' ? 'zh' : 'en');
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
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center border-2 border-cyan-500/50 m-4 border-dashed animate-pulse">
            <div className="text-cyan-400 font-mono text-xl tracking-widest uppercase font-bold">
                [{t.dropText}]
            </div>
        </div>
      )}

      <ChromaKeyModal 
        isOpen={isSuperKeyOpen} 
        onClose={() => setIsSuperKeyOpen(false)} 
        imageSrc={activeImage?.url || null} 
        onSave={handleSuperKeySave} 
        language={language}
      />
      {isEvolutionOpen && activeImage && (
          <EvolutionStage 
            imageSrc={activeImage.url} 
            baseSettings={settings} 
            onSave={(s) => { setSettings({...settings, motionScript: s, animationMode: AnimationMode.PARTICLES}); setIsEvolutionOpen(false); }} 
            onCancel={() => setIsEvolutionOpen(false)} 
            language={language}
          />
      )}

      {/* =====================================================================================
          UNIFIED 2-COLUMN LAYOUT
      ===================================================================================== */}
      
      {/* 1. MAIN VIEWPORT (LEFT) */}
      <main className="flex-1 relative flex flex-col bg-[#030303] overflow-hidden">
          
          {/* Header */}
          <div className="h-10 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#030303]">
               <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-zinc-500">
                   <span className="font-bold text-zinc-300">VIEWPORT 01</span>
                   <span>{settings.resolution}PX</span>
                   <span>{settings.renderMode}</span>
               </div>
               
               <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleLanguage}
                        className="text-[10px] font-bold text-zinc-600 hover:text-zinc-200 transition-colors"
                    >
                        {language === 'zh' ? 'EN' : '中'}
                    </button>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-700 hover:text-white transition-colors opacity-50 hover:opacity-100">
                        <Github size={14} />
                    </a>
               </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-grid-pattern group">
               
               {/* --- HUD OVERLAYS --- */}
               <div className="absolute top-0 inset-x-0 h-4 border-b border-zinc-900 bg-[#030303]/80 flex justify-between px-2 opacity-30 pointer-events-none">
                    {[...Array(20)].map((_,i) => <div key={i} className="w-[1px] h-full bg-zinc-800"/>)}
               </div>
               <div className="absolute left-0 inset-y-0 w-4 border-r border-zinc-900 bg-[#030303]/80 flex flex-col justify-between py-2 opacity-30 pointer-events-none">
                    {[...Array(20)].map((_,i) => <div key={i} className="h-[1px] w-full bg-zinc-800"/>)}
               </div>


               {activeImage ? (
                   <div className="relative z-10 p-12 w-full h-full flex flex-col">
                       <div className="flex-1 relative flex items-center justify-center">
                           <div className="shadow-2xl">
                               <AsciiRenderer 
                                 imageSrc={activeImage.url} 
                                 settings={settings} 
                                 language={language}
                               />
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="text-center space-y-4 opacity-20 select-none pointer-events-none flex flex-col items-center animate-pulse">
                       <div className="w-24 h-24 border border-dashed border-zinc-600 rounded-full flex items-center justify-center">
                          <ImageIcon size={32} className="text-zinc-600" />
                       </div>
                       <h1 className="text-xs font-mono text-zinc-600 tracking-[0.5em] uppercase">{t.noSignal}</h1>
                   </div>
               )}
          </div>
      </main>

      {/* 2. INSPECTOR PANEL (RIGHT) - 320px Fixed */}
      <aside className="w-80 z-20 shadow-[-5px_0_20px_rgba(0,0,0,0.5)]">
          <Controls 
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onCommit={handleCommit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onOpenEvolution={() => setIsEvolutionOpen(true)}
            language={language}
            
            // Gallery Props
            gallery={gallery}
            activeImageId={activeId}
            onSelectImage={setActiveId}
            onRemoveImage={removeImage}
            onImportImages={processFiles}
            onRemoveBg={handleRemoveBackground}
            isRemovingBg={isRemovingBg}
            onOpenChromaKey={() => setIsSuperKeyOpen(true)}
          />
      </aside>

    </div>
  );
};

export default App;
