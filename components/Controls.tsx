import React from 'react';
import { AsciiSettings, AnimationMode } from '../types';
import { DENSITY_SETS } from '../constants';
import { Settings2, Play, Zap, Monitor, Waves } from 'lucide-react';

interface ControlsProps {
  settings: AsciiSettings;
  onUpdate: (newSettings: AsciiSettings) => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, onUpdate }) => {
  
  const handleChange = (key: keyof AsciiSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900/80 backdrop-blur-md border-l border-zinc-800 h-full overflow-y-auto w-full md:w-80">
      
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Configuration</h2>
      </div>

      {/* Animation Mode */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Animation Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { mode: AnimationMode.STATIC, icon: <Monitor size={14}/>, label: 'Static' },
            { mode: AnimationMode.WAVE, icon: <Waves size={14}/>, label: 'Wave' },
            { mode: AnimationMode.JELLY, icon: <Zap size={14}/>, label: 'Jelly' },
            { mode: AnimationMode.MATRIX, icon: <Play size={14}/>, label: 'Matrix' },
            { mode: AnimationMode.SCANLINE, icon: <Monitor size={14}/>, label: 'Glitch' },
          ].map((item) => (
            <button
              key={item.mode}
              onClick={() => handleChange('animationMode', item.mode)}
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

      {/* Resolution */}
      <div className="space-y-2">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">Resolution (Columns)</label>
           <span className="text-xs text-indigo-400 font-mono">{settings.resolution}px</span>
        </div>
        <input
          type="range"
          min="40"
          max="200"
          step="10"
          value={settings.resolution}
          onChange={(e) => handleChange('resolution', parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">Font Size</label>
           <span className="text-xs text-indigo-400 font-mono">{settings.fontSize}px</span>
        </div>
        <input
          type="range"
          min="6"
          max="24"
          step="1"
          value={settings.fontSize}
          onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
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
          max="3.0"
          step="0.1"
          value={settings.contrast}
          onChange={(e) => handleChange('contrast', parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Animation Speed */}
      <div className="space-y-2">
        <div className="flex justify-between">
           <label className="text-xs font-semibold text-zinc-400">Speed</label>
           <span className="text-xs text-indigo-400 font-mono">{settings.animationSpeed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0"
          max="5.0"
          step="0.1"
          value={settings.animationSpeed}
          onChange={(e) => handleChange('animationSpeed', parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Text Color</label>
            <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={settings.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-500">{settings.color}</span>
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Background</label>
            <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-500">{settings.backgroundColor}</span>
            </div>
        </div>
      </div>

      {/* Char Set */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-400">Character Set</label>
        <select
          className="w-full bg-zinc-800 text-zinc-300 text-xs rounded-md p-2 border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          onChange={(e) => handleChange('density', e.target.value)}
          value={settings.density}
        >
          <option value={DENSITY_SETS.STANDARD}>Standard</option>
          <option value={DENSITY_SETS.COMPLEX}>High Detail</option>
          <option value={DENSITY_SETS.SIMPLE}>Simple</option>
          <option value={DENSITY_SETS.BLOCKS}>Blocks</option>
          <option value={DENSITY_SETS.MATRIX}>Matrix Katakana</option>
        </select>
      </div>

       {/* Invert */}
       <div className="flex items-center gap-3 pt-2">
          <input 
            type="checkbox" 
            id="invert"
            checked={settings.invert}
            onChange={(e) => handleChange('invert', e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 bg-zinc-800"
          />
          <label htmlFor="invert" className="text-sm text-zinc-300 cursor-pointer select-none">Invert Brightness</label>
      </div>
    </div>
  );
};