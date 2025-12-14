import React, { useState, useEffect } from 'react';
import { AsciiRenderer } from './AsciiRenderer';
import { AsciiSettings, Genome, Language } from '../types';
import { createRandomGenome, mutateGenome, genomeToScript, getSeedGenome } from '../services/geneticService';
import { Dna, Check, RefreshCw, X } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface EvolutionStageProps {
  imageSrc: string;
  baseSettings: AsciiSettings;
  onSave: (script: string) => void;
  onCancel: () => void;
  language?: Language;
}

export const EvolutionStage: React.FC<EvolutionStageProps> = ({ imageSrc, baseSettings, onSave, onCancel, language = 'zh' }) => {
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState<Genome[]>([]);
  const t = TRANSLATIONS[language];
  
  // Initialize with seeds
  useEffect(() => {
    // Generate initial population
    const p1 = getSeedGenome('runner');
    const p2 = getSeedGenome('jumper');
    const p3 = getSeedGenome('shaker');
    const p4 = createRandomGenome(0);
    setPopulation([p1, p2, p3, p4]);
  }, []);

  const handleSelect = (survivor: Genome) => {
    // Evolve next generation from survivor
    const nextGen = [
        mutateGenome(survivor, 0.1), // Mild mutation (refined)
        mutateGenome(survivor, 0.3), // Medium mutation
        mutateGenome(survivor, 0.6), // Heavy mutation
        survivor // Keep the winner (Elitism)
    ];
    setPopulation(nextGen);
    setGeneration(g => g + 1);
  };

  const handleReset = (type: 'runner' | 'jumper' | 'shaker') => {
      setGeneration(0);
      const seed = getSeedGenome(type);
      setPopulation([
          mutateGenome(seed, 0.1),
          mutateGenome(seed, 0.2),
          mutateGenome(seed, 0.3),
          seed
      ]);
  };

  // Create lightweight settings for previews to maintain FPS
  const previewSettings = {
      ...baseSettings,
      resolution: Math.min(baseSettings.resolution, 80), // Cap resolution
      fontSize: 8, // Fixed size
      showLabels: false
  };

  return (
    <div className="absolute inset-0 bg-[#09090b] z-50 flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center animate-pulse">
                 <Dna size={18} className="text-white"/>
             </div>
             <div>
                 <h2 className="text-lg font-bold text-white">{t.evolutionLab}</h2>
                 <p className="text-xs text-zinc-400">{t.gen} {generation} • {t.selectMutation}</p>
             </div>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={onCancel} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                 {t.exit}
             </button>
         </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-zinc-900">
          {population.map((genome, index) => {
              const script = genomeToScript(genome);
              return (
                  <div 
                    key={genome.id} 
                    className="relative group bg-black overflow-hidden cursor-pointer border-2 border-transparent hover:border-emerald-500 transition-all"
                    onClick={() => handleSelect(genome)}
                  >
                      <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                          #{index + 1} {genome.id}
                      </div>
                      
                      {/* Using RenderMode.PIXEL for speed in preview if desired, or just inherit */}
                      <AsciiRenderer 
                        imageSrc={imageSrc} 
                        settings={previewSettings} 
                        motionScriptOverride={script}
                        language={language}
                      />
                      
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              {t.selectBreed}
                          </span>
                      </div>
                      
                      {/* Quick Save Button */}
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave(script);
                        }}
                        className="absolute bottom-2 right-2 z-20 bg-zinc-800 hover:bg-emerald-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 shadow-xl border border-white/10"
                        title={t.saveOne}
                      >
                          <Check size={16} />
                      </button>
                  </div>
              );
          })}
      </div>

      {/* Footer Controls */}
      <div className="h-16 border-t border-zinc-800 bg-zinc-900 px-6 flex items-center justify-center gap-4">
          <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mr-2">{t.reseedPopulation}</span>
          
          <button onClick={() => handleReset('runner')} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg border border-zinc-700 transition-colors">
             <RefreshCw size={12} />
             {t.runner}
          </button>
          <button onClick={() => handleReset('jumper')} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg border border-zinc-700 transition-colors">
             <RefreshCw size={12} />
             {t.jumper}
          </button>
          <button onClick={() => handleReset('shaker')} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg border border-zinc-700 transition-colors">
             <RefreshCw size={12} />
             {t.chaos}
          </button>
      </div>

    </div>
  );
};