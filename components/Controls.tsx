

import React from 'react';
import { AsciiSettings, AnimationMode, RenderMode } from '../types';
import { DENSITY_SETS } from '../constants';
import { Settings2, Monitor, Grid, Type, LayoutGrid, Tag, Box, RotateCcw, RotateCw, Sparkles, ScanFace } from 'lucide-react';

interface ControlsProps {
  settings: AsciiSettings;
  onUpdate: (newSettings: AsciiSettings) => void;
  onCommit: (settings: AsciiSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  onUpdate, 
  onCommit,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  
  const handleChange = (key: keyof AsciiSettings, value: any, shouldCommit = false) => {
    const newSettings = { ...settings, [key]: value };
    onUpdate(newSettings);
    if (shouldCommit) {
      onCommit(newSettings);
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
                    Adjust to separate character from background. Higher = stricter.
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
                />
                <span className="text-xs font-mono text-zinc-500">{settings.backgroundColor}</span>
            </div>
        </div>
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
              <option value={DENSITY_SETS.MATRIX}>Matrix Katakana</option>
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