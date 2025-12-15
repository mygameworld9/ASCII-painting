
import React, { useState, useRef } from 'react';
import { AsciiSettings, AnimationMode, RenderMode, Language, GalleryItem } from '../types';
import { DENSITY_SETS, TRANSLATIONS } from '../constants';
import { Monitor, Grid, Dna, RotateCcw, RotateCw, Type, Box, Layout, Play, Code, Eye, EyeOff, Zap, Plus, Trash2, Eraser, Pipette, Loader2, Image as ImageIcon, Layers, FileImage, Sparkles, SlidersHorizontal } from 'lucide-react';
import { generateMotionScript } from '../services/geminiService';
import { Button } from './Button';

interface ControlsProps {
  settings: AsciiSettings;
  onUpdate: (newSettings: AsciiSettings) => void;
  onCommit: (settings: AsciiSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenEvolution?: () => void;
  language?: Language;
  
  // Gallery Props
  gallery: GalleryItem[];
  activeImageId: string | null;
  onSelectImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onImportImages: (files: FileList) => void;
  onRemoveBg: () => void;
  isRemovingBg: boolean;
  onOpenChromaKey: () => void;
}

const ControlGroup: React.FC<{ title: string; children: React.ReactNode, rightElement?: React.ReactNode, className?: string }> = ({ title, children, rightElement, className = "" }) => (
    <div className={`mb-6 ${className}`}>
        <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
                {title}
            </h3>
            {rightElement}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (val: number) => void;
    onCommit: () => void;
}> = ({ label, value, min, max, step, unit, onChange, onCommit }) => (
    <div className="group px-1">
        <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">{label}</label>
            <span className="text-[10px] font-mono text-zinc-500">
                {value.toFixed(step < 1 ? 1 : 0)}{unit}
            </span>
        </div>
        <div className="relative h-4 flex items-center">
             <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                onMouseUp={onCommit}
                onTouchEnd={onCommit}
                className="w-full z-10 opacity-0 cursor-pointer absolute inset-0"
            />
            {/* Track */}
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-600 group-hover:bg-cyan-500 transition-colors" 
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                />
            </div>
            {/* Thumb (Visual Only) */}
            <div 
                className="w-3 h-3 bg-zinc-200 rounded-full shadow-md absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
            />
        </div>
    </div>
);

export const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  onUpdate, 
  onCommit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenEvolution,
  language = 'zh',
  gallery,
  activeImageId,
  onSelectImage,
  onRemoveImage,
  onImportImages,
  onRemoveBg,
  isRemovingBg,
  onOpenChromaKey
}) => {
  const [activeTab, setActiveTab] = useState<'FILES' | 'TUNE' | 'FX'>('FILES');
  const [motionPrompt, setMotionPrompt] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = TRANSLATIONS[language];

  const handleChange = (key: keyof AsciiSettings, value: any, shouldCommit = false) => {
    const newSettings = { ...settings, [key]: value };
    onUpdate(newSettings);
    if (shouldCommit) {
      onCommit(newSettings);
    }
  };

  const handleGenerateScript = async () => {
    if (!motionPrompt.trim()) return;
    setIsGeneratingScript(true);
    try {
        const script = await generateMotionScript(motionPrompt);
        if (script) handleChange('motionScript', script, true);
    } catch(e) { console.error(e); } finally { setIsGeneratingScript(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) onImportImages(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-[#08080a] border-l border-zinc-900 text-zinc-300 font-sans select-none">
      
      {/* Header */}
      <div className="h-10 border-b border-zinc-900 flex items-center justify-between px-3 bg-[#08080a]">
        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-900 border border-cyan-500/50"></div>
            NEURAL STUDIO
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} title="Undo">
              <RotateCcw size={12} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} title="Redo">
              <RotateCw size={12} />
          </Button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-900 p-1 gap-1 bg-zinc-950/50">
          {[
              { id: 'FILES', label: t.projectFiles, icon: <FileImage size={12}/> },
              { id: 'TUNE', label: t.visual, icon: <SlidersHorizontal size={12}/> },
              { id: 'FX', label: t.fx, icon: <Sparkles size={12}/> }
           ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 py-1.5 rounded-[2px] text-[10px] font-medium transition-all ${
                    activeTab === tab.id 
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                  {tab.id === 'FILES' && <Layers size={12}/>}
                  {tab.id === 'TUNE' && <Layout size={12}/>}
                  {tab.id === 'FX' && <Sparkles size={12}/>}
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          
          {/* ======================= TAB: FILES ======================= */}
          {activeTab === 'FILES' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  
                  {/* Actions Area */}
                  <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled={!activeImageId || isRemovingBg}
                        onClick={onRemoveBg}
                        icon={isRemovingBg ? <Loader2 size={12} className="animate-spin"/> : <Eraser size={12}/>}
                      >
                          {t.removeBg}
                      </Button>
                      <Button 
                        variant="secondary"
                        size="sm"
                        disabled={!activeImageId}
                        onClick={onOpenChromaKey}
                        icon={<Pipette size={12}/>}
                      >
                          {t.chromaKey}
                      </Button>
                  </div>

                  {/* Upload Area */}
                  <div className="relative group">
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-800 rounded-lg hover:border-cyan-500/50 hover:bg-cyan-900/5 transition-all cursor-pointer">
                            <Plus size={20} className="text-zinc-600 group-hover:text-cyan-500 mb-2"/>
                            <span className="text-[10px] text-zinc-500 group-hover:text-cyan-400 font-medium">{t.dropText}</span>
                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                            />
                        </label>
                  </div>

                  {/* Gallery Grid */}
                  <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t.items} ({gallery.length})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          {gallery.map(item => (
                              <div 
                                key={item.id}
                                onClick={() => onSelectImage(item.id)}
                                className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer group transition-all ${
                                    activeImageId === item.id 
                                    ? 'border-cyan-500 shadow-sm ring-1 ring-cyan-500/20' 
                                    : 'border-zinc-800 hover:border-zinc-600'
                                }`}
                              >
                                  <img src={item.url} className="w-full h-full object-cover" alt="" />
                                  <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${activeImageId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                      <span className="text-[9px] font-medium text-white">{t.processImage}</span>
                                  </div>
                                  
                                  {/* Delete Button */}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveImage(item.id); }}
                                    className="absolute top-1 right-1 p-1.5 bg-black/80 text-zinc-400 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                      <Trash2 size={10} />
                                  </button>
                                  
                                  {/* Label */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                                      <p className="text-[8px] text-zinc-400 truncate font-mono">{item.name}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                      {gallery.length === 0 && (
                          <div className="text-center py-8 text-[10px] text-zinc-600 italic">
                              No images imported
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* ======================= TAB: TUNE (Visual + Style) ======================= */}
          {activeTab === 'TUNE' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                {/* Mode Selector - Prominent */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                    {[
                        { mode: RenderMode.ASCII, icon: <Type size={14}/>, label: t.text },
                        { mode: RenderMode.BEAD, icon: <Grid size={14}/>, label: t.bead },
                        { mode: RenderMode.PIXEL, icon: <Layout size={14}/>, label: t.pixel },
                        { mode: RenderMode.MINECRAFT, icon: <Box size={14}/>, label: t.voxel },
                    ].map(m => (
                        <button
                            key={m.mode}
                            onClick={() => {
                                const s = {...settings, renderMode: m.mode};
                                onUpdate(s); onCommit(s);
                            }}
                            className={`flex flex-col items-center justify-center py-2 gap-1 rounded-[4px] transition-all ${
                                settings.renderMode === m.mode 
                                ? 'bg-zinc-800 text-cyan-400 shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                            title={m.label}
                        >
                            {m.icon}
                        </button>
                    ))}
                </div>

                <ControlGroup title={t.gridMetrics}>
                    <SliderControl 
                        label={t.resolution} 
                        value={settings.resolution} min={20} max={320} step={5} unit="px"
                        onChange={(v) => handleChange('resolution', v)} onCommit={() => onCommit(settings)}
                    />
                    <SliderControl 
                        label={t.cellSize}
                        value={settings.fontSize} min={4} max={32} step={1} unit="px"
                        onChange={(v) => handleChange('fontSize', v)} onCommit={() => onCommit(settings)}
                    />
                </ControlGroup>

                <ControlGroup title={t.signalProcessing}>
                    <SliderControl 
                        label={t.contrast}
                        value={settings.contrast} min={0.1} max={5.0} step={0.1}
                        onChange={(v) => handleChange('contrast', v)} onCommit={() => onCommit(settings)}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button 
                            variant="secondary"
                            size="sm"
                            active={settings.invert}
                            onClick={() => handleChange('invert', !settings.invert, true)}
                            icon={<Zap size={10} className={settings.invert ? 'fill-current' : ''} />}
                        >
                            {t.invertSignal}
                        </Button>
                        <Button 
                            variant="secondary"
                            size="sm"
                            active={settings.transparentBackground}
                            onClick={() => handleChange('transparentBackground', !settings.transparentBackground, true)}
                            icon={settings.transparentBackground ? <EyeOff size={10} /> : <Eye size={10} />} 
                        >
                            {settings.transparentBackground ? t.alpha0 : t.alpha1}
                        </Button>
                    </div>
                </ControlGroup>

                <ControlGroup title={t.colorChannel}>
                      <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] text-zinc-400">{t.fgColor}</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-zinc-500">{settings.color}</span>
                                  <div className="relative w-5 h-5 rounded border border-zinc-700 overflow-hidden">
                                      <input type="color" value={settings.color} onChange={(e) => handleChange('color', e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                      <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: settings.color}}></div>
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] text-zinc-400">{t.bgColor}</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-zinc-500">{settings.transparentBackground ? t.bgNull : settings.backgroundColor}</span>
                                  <div className={`relative w-5 h-5 rounded border border-zinc-700 overflow-hidden ${settings.transparentBackground ? 'opacity-30' : ''}`}>
                                      <input type="color" value={settings.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} disabled={settings.transparentBackground} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                      <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: settings.backgroundColor}}></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                 </ControlGroup>

                 {settings.renderMode === RenderMode.ASCII && (
                     <ControlGroup title={t.characterMap}>
                        <select
                            className="w-full bg-[#0a0a0a] text-zinc-300 text-[10px] p-2 border border-zinc-800 rounded outline-none focus:border-cyan-700 font-mono"
                            onChange={(e) => handleChange('density', e.target.value, true)}
                            value={settings.density}
                        >
                            <option value={DENSITY_SETS.COMPLEX}>{t.mapHighDetail}</option>
                            <option value={DENSITY_SETS.STANDARD}>{t.mapStandard}</option>
                            <option value={DENSITY_SETS.SIMPLE}>{t.mapMinimal}</option>
                            <option value={DENSITY_SETS.BLOCKS}>{t.mapBlocks}</option>
                        </select>
                     </ControlGroup>
                 )}
             </div>
          )}

          {/* ======================= TAB: FX ======================= */}
          {activeTab === 'FX' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                <ControlGroup title={t.physicsEngine}>
                    <div className="flex bg-zinc-900/50 rounded p-1 mb-4 border border-zinc-800/50">
                        {[
                            { mode: AnimationMode.STATIC, icon: <Monitor size={12}/>, label: t.static },
                            { mode: AnimationMode.PARTICLES, icon: <Dna size={12}/>, label: t.dynamic },
                        ].map(item => (
                            <button
                                key={item.mode}
                                onClick={() => handleChange('animationMode', item.mode, true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-medium rounded-[2px] transition-all ${
                                    settings.animationMode === item.mode
                                    ? 'bg-zinc-800 text-cyan-400 shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>

                    {settings.animationMode === AnimationMode.PARTICLES && (
                        <div className="space-y-4 animate-in fade-in">
                            <SliderControl 
                                label={t.timeScale}
                                value={settings.animationSpeed} min={0} max={5.0} step={0.1} unit="x"
                                onChange={(v) => handleChange('animationSpeed', v)} onCommit={() => onCommit(settings)}
                            />
                            <SliderControl 
                                label={t.amplitude}
                                value={settings.animationIntensity} min={0} max={5.0} step={0.1}
                                onChange={(v) => handleChange('animationIntensity', v)} onCommit={() => onCommit(settings)}
                            />
                             <SliderControl 
                                label={t.edgeThreshold}
                                value={settings.extractionThreshold} min={0} max={100} step={1}
                                onChange={(v) => handleChange('extractionThreshold', v)} onCommit={() => onCommit(settings)}
                            />

                            <div className="pt-2">
                                <Button 
                                    onClick={onOpenEvolution}
                                    className="w-full"
                                    icon={<Dna size={12}/>}
                                >
                                    {t.openGeneticLab}
                                </Button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-zinc-900">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block flex items-center gap-2">
                                    <Code size={12}/> {t.neuralScripting}
                                </label>
                                <div className="flex gap-1 relative">
                                    <input
                                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded text-[10px] px-2 py-2 outline-none focus:border-cyan-800 text-zinc-300 placeholder:text-zinc-700 font-mono"
                                        placeholder={t.enterPrompt}
                                        value={motionPrompt}
                                        onChange={(e) => setMotionPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateScript()}
                                    />
                                    <Button 
                                        onClick={handleGenerateScript}
                                        disabled={isGeneratingScript || !motionPrompt}
                                        size="icon"
                                        variant="secondary"
                                        icon={<Play size={10}/>}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </ControlGroup>
              </div>
          )}

      </div>
    </div>
  );
};
