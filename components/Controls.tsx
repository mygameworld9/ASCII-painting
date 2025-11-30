import React from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { DENSITY_SETS } from '../constants';
import { Settings2, Monitor, Grid, Type, LayoutGrid, Tag, Box, RotateCcw, RotateCw, Sparkles, ScanFace, Wand2, User, Zap, Code, Play, EyeOff } from 'lucide-react';
import { tuneParticleSettings, generateMotionScript } from '../services/geminiService';

interface ControlsProps {
  settings: AsciiSettings;
  onUpdate: (newSettings: AsciiSettings) => void;
  onCommit: (settings: AsciiSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AI_PRESETS = [
  { 
    id: 'isolate', 
    label: 'Isolate Subject', 
    icon: <ScanFace size={12}/>, 
    prompt: 'Strictly isolate the subject. Set extractionThreshold HIGH (65-80) to completely remove the background. Moderate speed.' 
  },
  { 
    id: 'restore', 
    label: 'Restore Detail', 
    icon: <User size={12}/>, 
    prompt: 'Show everything. Set extractionThreshold VERY LOW (0-15) to restore full background and details. Slow speed, low intensity.' 
  },
  { 
    id: 'energy', 
    label: 'Energy Flow', 
    icon: <Zap size={12}/>, 
    prompt: 'High energy chaotic particle flow. Fast speed, high intensity, medium threshold.' 
  }
];

export const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  onUpdate, 
  onCommit,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [tuningPrompt, setTuningPrompt] = React.useState("");
  const [motionPrompt, setMotionPrompt] = React.useState("");
  const [isTuning, setIsTuning] = React.useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = React.useState(false);
  
  const handleChange = (key: keyof AsciiSettings, value: any, shouldCommit = false) => {
    const newSettings = { ...settings, [key]: value };
    onUpdate(newSettings);
    if (shouldCommit) {
      onCommit(newSettings);
    }
  };

  const handleAiTune = async (promptOverride?: string) => {
    const promptToUse = promptOverride || tuningPrompt;
    if (!promptToUse.trim()) return;
    
    setIsTuning(true);
    // If using a preset, update the text box to show what's happening (optional)
    if (promptOverride) setTuningPrompt(promptOverride);

    try {
        const newParams = await tuneParticleSettings(promptToUse);
        const merged = { ...settings, ...newParams };
        onUpdate(merged);
        onCommit(merged);
    } catch (e) {
        console.error("Tuning failed", e);
    } finally {
        setIsTuning(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!motionPrompt.trim()) return;
    setIsGeneratingScript(true);
    try {
        const script = await generateMotionScript(motionPrompt);
        if (script) {
            handleChange('motionScript', script, true);
        }
    } catch(e) {
        console.error("Script failed", e);
    } finally {
        setIsGeneratingScript(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900/80 backdrop-blur-md border-l border-zinc-800 h-full overflow-y-auto w-full md:w-80">
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Configuration</h2>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded hover:bg-zinc-700"
            title="Undo"
          >
            <RotateCcw size={14} />
          </button>
          <div className="w-px h-4 bg-zinc-700"></div>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded hover:bg-zinc-700"
            title="Redo"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Render Mode */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Render Style</label>
        <div className="grid grid-cols-2 gap-2 bg-zinc-800 p-1 rounded-lg">
            <button
                onClick={() => handleChange('renderMode', RenderMode.ASCII, true)}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                    settings.renderMode === RenderMode.ASCII
                    ? 'bg-zinc-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="ASCII Character Art"
            >
                <Type size={14} />
                ASCII
            </button>
            <button
                onClick={() => handleChange('renderMode', RenderMode.BEAD, true)}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                    settings.renderMode === RenderMode.BEAD
                    ? 'bg-zinc-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Round Bead Art"
            >
                <Grid size={14} />
                Bead
            </button>
            <button
                onClick={() => handleChange('renderMode', RenderMode.PIXEL, true)}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                    settings.renderMode === RenderMode.PIXEL
                    ? 'bg-zinc-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Pixel Art"
            >
                <LayoutGrid size={14} />
                Pixel
            </button>
            <button
                onClick={() => handleChange('renderMode', RenderMode.MINECRAFT, true)}
                className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                    settings.renderMode === RenderMode.MINECRAFT
                    ? 'bg-zinc-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Minecraft Block Style"
            >
                <Box size={14} />
                Minecraft
            </button>
        </div>
      </div>
      
      {/* Bead Options */}
      {settings.renderMode === RenderMode.BEAD && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag size={14} className="text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-200">Show Color Indices</span>
                </div>
                <input 
                    type="checkbox" 
                    checked={settings.showLabels}
                    onChange={(e) => handleChange('showLabels', e.target.checked, true)}
                    className="w-4 h-4 rounded border-indigo-500/50 text-indigo-500 focus:ring-indigo-500 bg-zinc-800"
                />
            </div>
            <p className="text-[10px] text-indigo-300/60 leading-tight">
                Displays a palette legend and numbers beads by color.
            </p>
        </div>
      )}

      {/* Animation Mode */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Animation Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { mode: AnimationMode.STATIC, icon: <Monitor size={14}/>, label: 'Static' },
            { mode: AnimationMode.PARTICLES, icon: <Sparkles size={14}/>, label: 'Particles' },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => handleChange('animationMode', item.mode, true)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                settings.animationMode === item.mode
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Particle Tuner & Motion Script */}
      {settings.animationMode === AnimationMode.PARTICLES && (
          <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
            
            {/* 1. Parameter Tuner */}
            <div className="p-3 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 shadow-inner">
             <label className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                 <Wand2 size={12} />
                 AI Parameter Tuner
             </label>
             <div className="flex gap-2 mb-2">
                 <input
                     type="text"
                     value={tuningPrompt}
                     onChange={(e) => setTuningPrompt(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAiTune()}
                     placeholder="E.g. 'Calm ghostly float'"
                     className="flex-1 bg-zinc-950/50 text-[10px] text-white p-2 rounded border border-zinc-700 focus:border-indigo-500 outline-none placeholder:text-zinc-600"
                 />
                 <button
                     onClick={() => handleAiTune()}
                     disabled={isTuning || !tuningPrompt.trim()}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px]"
                     title="Tune Parameters"
                 >
                     {isTuning ? (
                         <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                         <Sparkles size={14} />
                     )}
                 </button>
             </div>
             <div className="grid grid-cols-3 gap-1.5">
                {AI_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAiTune(preset.prompt)}
                    disabled={isTuning}
                    className="flex flex-col items-center justify-center gap-1.5 p-2 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 hover:border-indigo-500/50 rounded transition-all text-center group"
                    title={preset.prompt}
                  >
                    <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      {preset.icon}
                    </div>
                    <span className="text-[9px] font-medium text-zinc-400 group-hover:text-white leading-tight">
                      {preset.label}
                    </span>
                  </button>
                ))}
             </div>
            </div>

            {/* 2. Motion Script Designer */}
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                <label className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
                    <Code size={12} />
                    AI Motion Designer
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={motionPrompt}
                        onChange={(e) => setMotionPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateScript()}
                        placeholder="Describe movement (e.g. 'Vortex')"
                        className="flex-1 bg-zinc-950/50 text-[10px] text-white p-2 rounded border border-zinc-700 focus:border-emerald-500 outline-none placeholder:text-zinc-600"
                    />
                    <button
                        onClick={() => handleGenerateScript()}
                        disabled={isGeneratingScript || !motionPrompt.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px]"
                        title="Generate Code Script"
                    >
                         {isGeneratingScript ? (
                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : (
                             <Play size={14} />
                         )}
                    </button>
                </div>
                <p className="text-[9px] text-zinc-500">
                    Generates custom Javascript math for particle paths.
                </p>
            </div>
          </div>
      )}

      {/* Animation Controls */}
      <div className="space-y-4 border-t border-zinc-800 pt-4">
        {/* Animation Speed */}
        <div className="space-y-2">
            <div className="flex justify-between">
            <label className="text-xs font-semibold text-zinc-400">Animation Speed</label>
            <span className="text-xs text-indigo-400 font-mono">{settings.animationSpeed.toFixed(1)}x</span>
            </div>
            <input
            type="range"
            min="0"
            max="5.0"
            step="0.1"
            value={settings.animationSpeed}
            onChange={(e) => handleChange('animationSpeed', parseFloat(e.target.value), false)}
            onMouseUp={() => onCommit(settings)}
            onTouchEnd={() => onCommit(settings)}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>

        {/* Animation Intensity */}
        {settings.animationMode !== AnimationMode.STATIC && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between">
                <label className="text-xs font-semibold text-zinc-400">Intensity / Amp</label>
                <span className="text-xs text-indigo-400 font-mono">{settings.animationIntensity.toFixed(1)}</span>
            </div>
            <input
                type="range"
                min="0"
                max="5.0"
                step="0.1"
                value={settings.animationIntensity}
                onChange={(e) => handleChange('animationIntensity', parseFloat(e.target.value), false)}
                onMouseUp={() => onCommit(settings)}
                onTouchEnd={() => onCommit(settings)}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            </div>
        )}

        {/* Extraction Threshold (Particles Mode Only) */}
        {settings.animationMode === AnimationMode.PARTICLES && (
             <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ScanFace size={14} className="text-indigo-400"/>
                        <label className="text-xs font-semibold text-zinc-300">Subject Threshold</label>
                    </div>
                    <span className="text-xs text-indigo-400 font-mono">{settings.extractionThreshold}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.extractionThreshold}
                    onChange={(e) => handleChange('extractionThreshold', parseInt(e.target.value), false)}
                    onMouseUp={() => onCommit(settings)}
                    onTouchEnd={() => onCommit(settings)}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-zinc-500 leading-tight">
                    Higher = Only Subject (Isolate). Lower = Full Image (Restore).
                </p>
            </div>
        )}
      </div>

      {/* Resolution */}
      <div className="space-y-2 pt-4 border-t border-zinc-800">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">Resolution (Grid)</label>
           <span className="text-xs text-indigo-400 font-mono">{settings.resolution}px</span>
        </div>
        <input
          type="range"
          min="20"
          max="320" 
          step="5"
          value={settings.resolution}
          onChange={(e) => handleChange('resolution', parseInt(e.target.value), false)}
          onMouseUp={() => onCommit(settings)}
          onTouchEnd={() => onCommit(settings)}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Font Size / Bead Size */}
      <div className="space-y-2">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">
             {settings.renderMode === RenderMode.ASCII ? 'Font Size' : 'Cell Size'}
           </label>
           <span className="text-xs text-indigo-400 font-mono">{settings.fontSize}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="32"
          step="1"
          value={settings.fontSize}
          onChange={(e) => handleChange('fontSize', parseInt(e.target.value), false)}
          onMouseUp={() => onCommit(settings)}
          onTouchEnd={() => onCommit(settings)}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">Contrast</label>
           <span className="text-xs text-indigo-400 font-mono">{settings.contrast.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={settings.contrast}
          onChange={(e) => handleChange('contrast', parseFloat(e.target.value), false)}
          onMouseUp={() => onCommit(settings)}
          onTouchEnd={() => onCommit(settings)}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Colors - Show only relevant controls */}
      <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
        {settings.renderMode === RenderMode.ASCII && (
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Text Color</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={settings.color}
                        onChange={(e) => handleChange('color', e.target.value, false)}
                        onBlur={() => onCommit(settings)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-zinc-500">{settings.color}</span>
                </div>
            </div>
        )}
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Background</label>
            <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value, false)}
                    onBlur={() => onCommit(settings)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    disabled={settings.transparentBackground}
                />
                <span className={`text-xs font-mono transition-colors ${settings.transparentBackground ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {settings.transparentBackground ? 'None' : settings.backgroundColor}
                </span>
            </div>
        </div>
      </div>
      
      {/* Transparent Background Toggle */}
      <div className="flex items-center gap-3 mt-2">
          <input 
            type="checkbox" 
            id="transparency"
            checked={settings.transparentBackground}
            onChange={(e) => handleChange('transparentBackground', e.target.checked, true)}
            className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 bg-zinc-800"
          />
          <label htmlFor="transparency" className="text-sm text-zinc-300 cursor-pointer select-none flex items-center gap-2">
             <EyeOff size={14} className="text-zinc-400"/>
             Transparent Background
          </label>
      </div>

      {/* Char Set - Only for ASCII */}
      {settings.renderMode === RenderMode.ASCII && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-zinc-400">Character Set</label>
            <select
              className="w-full bg-zinc-800 text-zinc-300 text-xs rounded-md p-2 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              onChange={(e) => handleChange('density', e.target.value, true)}
              value={settings.density}
            >
              <option value={DENSITY_SETS.STANDARD}>Standard</option>
              <option value={DENSITY_SETS.COMPLEX}>High Detail</option>
              <option value={DENSITY_SETS.SIMPLE}>Simple</option>
              <option value={DENSITY_SETS.BLOCKS}>Blocks</option>
            </select>
          </div>
      )}

       {/* Invert */}
       <div className="flex items-center gap-3 pt-4 border-t border-zinc-800 mt-2">
          <input 
            type="checkbox" 
            id="invert"
            checked={settings.invert}
            onChange={(e) => handleChange('invert', e.target.checked, true)}
            className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 bg-zinc-800"
          />
          <label htmlFor="invert" className="text-sm text-zinc-300 cursor-pointer select-none">Invert {settings.renderMode === RenderMode.ASCII ? 'Brightness' : 'Colors'}</label>
      </div>
    </div>
  );
};