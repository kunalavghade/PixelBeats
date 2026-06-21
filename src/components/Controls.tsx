import React from 'react';
import { Play, Settings2, Download } from 'lucide-react';
import { useAppStore, Preset } from '../store/useAppStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { cn } from '../utils';

const presets: { id: Preset; label: string; desc: string }[] = [
  { id: 'NES', label: 'NES', desc: '8-bit, 8kHz' },
  { id: 'GameBoy', label: 'Game Boy', desc: '8-bit, 11kHz' },
  { id: 'Atari', label: 'Atari 2600', desc: '8-bit, 4kHz' },
  { id: 'Arcade', label: 'Arcade', desc: '8-bit, 22kHz' },
  { id: 'Custom', label: 'Custom', desc: '8-bit, 16kHz' },
];

export function Controls() {
  const { file, preset, setPreset, status, convertedAudioUrl } = useAppStore();
  const { isLoaded, processVideo } = useFFmpeg();

  const handleConvert = () => {
    if (file) {
      processVideo(file, preset);
    }
  };

  const handleDownload = () => {
    if (convertedAudioUrl) {
      const a = document.createElement('a');
      a.href = convertedAudioUrl;
      a.download = `pixelbeats_${preset.toLowerCase()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!file) return null;

  return (
    <div className="glass-panel p-6 max-w-3xl mx-auto w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
        <Settings2 className="w-5 h-5 text-accent" />
        <h2 className="text-xl pixel-font text-white">CONVERSION SETTINGS</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            disabled={status === 'extracting' || status === 'converting'}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200",
              preset === p.id 
                ? "border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-700",
              (status === 'extracting' || status === 'converting') && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="pixel-font text-lg mb-1">{p.label}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        {!isLoaded ? (
          <div className="text-amber-400 text-sm pixel-font animate-pulse">
            LOADING ENGINE...
          </div>
        ) : (
          <div className="flex gap-4 w-full">
            <button
              onClick={handleConvert}
              disabled={status === 'extracting' || status === 'converting'}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white py-3 px-6 rounded-lg font-bold tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="pixel-font text-xl mt-1">
                {status === 'idle' || status === 'error' ? 'START CONVERSION' : 'RE-CONVERT'}
              </span>
            </button>
            
            {status === 'done' && convertedAudioUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground py-3 px-6 rounded-lg font-bold tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span className="pixel-font text-xl mt-1">SAVE</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
