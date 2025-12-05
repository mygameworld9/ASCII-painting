import React, { useState } from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { DENSITY_SETS } from '../constants';
import { Monitor, Grid, Sparkles, Zap, Eye, EyeOff, Play, Code, Dna, RotateCcw, RotateCw, Type, Box, Layout, MousePointer2 } from 'lucide-react';
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
}

const ControlGroup: React.FC<{ title: string; children: React.ReactNode, rightElement?: React.ReactNode }> = ({ title, children, rightElement }) => (
    <div className="mb-8 animate-fade-in border-l border-zinc-800/50 pl-4 ml-1">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500 font-mono flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-500/50 rounded-full"></span>
                {title}
            </h3>
            {rightElement}
        </div>
        <div className="space-y-5">
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
    <div className="group">
        <div className="flex justify-between items-end mb-2">
            <label className="text-[10px] font-bold text-zinc-400 group-hover:text-cyan-400 transition-colors font-mono tracking-wider">{label}</label>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 border border-cyan-900/50 min-w-[30px] text-center">
                {value.toFixed(step < 1 ? 1 : 0)}{unit}
            </span>
        </div>
        <div className="relative h-6 flex items-center">
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
            {/* Custom Track Visuals - Mechanical Look */}
            <div className="w-full h-[1px] bg-zinc-800 relative flex items-center">
                <div 
                    className="h-[1px] bg-cyan-500 shadow-[0_0_5px_rgba(0,243,255,0.5)]" 
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                />
                {/* Thumb Visual */}
                <div 
                    className="w-2 h-4 bg-black border border-cyan-500 absolute top-1/2 -translate-y-1/2 transition-transform shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                    style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 4px)` }}
                />
            </div>
            {/* Ticks */}
            <div className="absolute bottom-0 w-full flex justify-between px-[2px]">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-[1px] h-1 bg-zinc-800"></div>
                ))}
            </div>
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
  onOpenEvolution
}) => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'STYLE' | 'FX'>('VISUAL');
  const [motionPrompt, setMotionPrompt] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
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

  return (
    <div className="h-full flex flex-col bg-[#08080a] text-zinc-300 font-sans select-none">
      
      {/* Top Header: Undo/Redo */}
      <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#050505]">
        <span className="text-[9px] font-mono text-zinc-600 tracking-widest">INSPECTOR</span>
        <div className="flex items-center gap-px">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 hover:bg-zinc-800 hover:text-cyan-400 disabled:opacity-20 transition-colors rounded-sm"><RotateCcw size={10} /></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 hover:bg-zinc-800 hover:text-cyan-400 disabled:opacity-20 transition-colors rounded-sm"><RotateCw size={10} /></button>
        </div>
      </div>

      {/* Industrial Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-950">
          {['VISUAL', 'STYLE', 'FX'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[9px] font-bold tracking-[0.15em] transition-all relative font-mono ${activeTab === tab ? 'text-cyan-400 bg-cyan-950/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'}`}
              >
                  {tab}
                  {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_8px_rgba(0,243,255,0.8)]"/>
                  )}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#08080a]">
          
          {/* TAB 1: VISUAL */}
          {activeTab === 'VISUAL' && (
             <>
                <ControlGroup title="Grid Metrics">
                    <SliderControl 
                        label="RESOLUTION" 
                        value={settings.resolution} min={20} max={320} step={5} unit="px"
                        onChange={(v) => handleChange('resolution', v)} onCommit={() => onCommit(settings)}
                    />
                    <SliderControl 
                        label="CELL SIZE"
                        value={settings.fontSize} min={4} max={32} step={1} unit="px"
                        onChange={(v) => handleChange('fontSize', v)} onCommit={() => onCommit(settings)}
                    />
                </ControlGroup>

                <ControlGroup title="Signal Processing">
                    <SliderControl 
                        label="CONTRAST" 
                        value={settings.contrast} min={0.1} max={5.0} step={0.1}
                        onChange={(v) => handleChange('contrast', v)} onCommit={() => onCommit(settings)}
                    />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button 
                            onClick={() => handleChange('invert', !settings.invert, true)}
                            className={`flex items-center justify-center gap-2 py-2.5 border text-[9px] uppercase font-bold tracking-wider transition-all ${settings.invert ? 'bg-zinc-800 border-zinc-500 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                        >
                            <Zap size={10} className={settings.invert ? 'text-yellow-400 fill-yellow-400' : ''} /> Invert Signal
                        </button>
                        <button 
                            onClick={() => handleChange('transparentBackground', !settings.transparentBackground, true)}
                            className={`flex items-center justify-center gap-2 py-2.5 border text-[9px] uppercase font-bold tracking-wider transition-all ${settings.transparentBackground ? 'bg-zinc-800 border-zinc-500 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                        >
                            {settings.transparentBackground ? <EyeOff size={10} /> : <Eye size={10} />} 
                            {settings.transparentBackground ? 'Alpha: 0' : 'Alpha: 1'}
                        </button>
                    </div>
                </ControlGroup>
             </>
          )}

          {/* TAB 2: STYLE */}
          {activeTab === 'STYLE' && (
              <>
                 <ControlGroup title="Render Kernel">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                            { mode: RenderMode.ASCII, icon: <Type size={12}/>, label: 'TEXT' },
                            { mode: RenderMode.BEAD, icon: <Grid size={12}/>, label: 'BEAD' },
                            { mode: RenderMode.PIXEL, icon: <Layout size={12}/>, label: 'PIXEL' },
                            { mode: RenderMode.MINECRAFT, icon: <Box size={12}/>, label: 'VOXEL' },
                        ].map(m => (
                            <button
                                key={m.mode}
                                onClick={() => {
                                    const s = {...settings, renderMode: m.mode};
                                    onUpdate(s); onCommit(s);
                                }}
                                className={`flex flex-col items-center justify-center gap-1 h-14 border text-[9px] font-bold tracking-widest transition-all ${settings.renderMode === m.mode ? 'bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]' : 'border-zinc-800 bg-zinc-900/50 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'}`}
                            >
                                {m.icon} {m.label}
                            </button>
                        ))}
                      </div>
                 </ControlGroup>

                 <ControlGroup title="Color Channel">
                      <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between border border-zinc-800 p-2 bg-zinc-900/50">
                              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">FG_COLOR</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-cyan-600">{settings.color}</span>
                                  <div className="relative w-6 h-6 border border-zinc-700">
                                      <input type="color" value={settings.color} onChange={(e) => handleChange('color', e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                      <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: settings.color}}></div>
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center justify-between border border-zinc-800 p-2 bg-zinc-900/50">
                              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">BG_COLOR</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-zinc-600">{settings.transparentBackground ? 'NULL' : settings.backgroundColor}</span>
                                  <div className={`relative w-6 h-6 border border-zinc-700 ${settings.transparentBackground ? 'opacity-20' : ''}`}>
                                      <input type="color" value={settings.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} disabled={settings.transparentBackground} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                      <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: settings.backgroundColor}}></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                 </ControlGroup>

                 {settings.renderMode === RenderMode.ASCII && (
                     <ControlGroup title="Character Map">
                        <select
                            className="w-full bg-black text-cyan-500 text-[10px] p-3 border border-zinc-800 outline-none focus:border-cyan-600 font-mono tracking-wider appearance-none"
                            onChange={(e) => handleChange('density', e.target.value, true)}
                            value={settings.density}
                        >
                            <option value={DENSITY_SETS.COMPLEX}>MAP_A: HIGH_DETAIL</option>
                            <option value={DENSITY_SETS.STANDARD}>MAP_B: STANDARD</option>
                            <option value={DENSITY_SETS.SIMPLE}>MAP_C: MINIMAL</option>
                            <option value={DENSITY_SETS.BLOCKS}>MAP_D: SOLID_BLOCKS</option>
                        </select>
                     </ControlGroup>
                 )}
              </>
          )}

          {/* TAB 3: FX */}
          {activeTab === 'FX' && (
              <>
                <ControlGroup title="Physics Engine">
                    <div className="flex bg-zinc-900/50 border border-zinc-800 p-1 mb-6">
                        {[
                            { mode: AnimationMode.STATIC, icon: <Monitor size={12}/>, label: 'STATIC' },
                            { mode: AnimationMode.PARTICLES, icon: <Dna size={12}/>, label: 'DYNAMIC' },
                        ].map(item => (
                            <button
                                key={item.mode}
                                onClick={() => handleChange('animationMode', item.mode, true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    settings.animationMode === item.mode
                                    ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-600' 
                                    : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>

                    {settings.animationMode === AnimationMode.PARTICLES && (
                        <div className="space-y-6 animate-fade-in">
                            <SliderControl 
                                label="TIME SCALE" 
                                value={settings.animationSpeed} min={0} max={5.0} step={0.1} unit="x"
                                onChange={(v) => handleChange('animationSpeed', v)} onCommit={() => onCommit(settings)}
                            />
                            <SliderControl 
                                label="AMPLITUDE" 
                                value={settings.animationIntensity} min={0} max={5.0} step={0.1}
                                onChange={(v) => handleChange('animationIntensity', v)} onCommit={() => onCommit(settings)}
                            />
                             <SliderControl 
                                label="EDGE THRESHOLD" 
                                value={settings.extractionThreshold} min={0} max={100} step={1}
                                onChange={(v) => handleChange('extractionThreshold', v)} onCommit={() => onCommit(settings)}
                            />

                            <Button 
                                onClick={onOpenEvolution}
                                variant="cyber"
                                className="w-full py-3"
                                icon={<Dna size={14}/>}
                            >
                                Open Genetic Lab
                            </Button>

                            <div className="mt-8 pt-4 border-t border-zinc-800 border-dashed">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase mb-3 block flex items-center gap-2 tracking-widest"><Code size={12}/> Neural Scripting</label>
                                <div className="flex gap-0 relative">
                                    <input
                                        className="w-full bg-black border border-zinc-800 text-[10px] px-3 py-3 outline-none focus:border-cyan-600 text-cyan-400 placeholder:text-zinc-800 font-mono tracking-wide"
                                        placeholder="Enter natural language prompt..."
                                        value={motionPrompt}
                                        onChange={(e) => setMotionPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateScript()}
                                    />
                                    <button 
                                        onClick={handleGenerateScript}
                                        disabled={isGeneratingScript || !motionPrompt}
                                        className="absolute right-1 top-1 bottom-1 bg-zinc-900 hover:bg-zinc-800 px-3 text-cyan-500 border border-zinc-800 hover:border-cyan-500 transition-colors"
                                    >
                                        <Play size={10}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </ControlGroup>
              </>
          )}

      </div>
    </div>
  );
};