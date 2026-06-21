
import { Play, Settings2, Download } from 'lucide-react';
import { useAppStore, type Preset } from '../store/useAppStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { cn } from '../utils';

const presets: { id: Preset; label: string; desc: string }[] = [
  { id: 'NES', label: 'NES', desc: '8-bit, 8kHz' },
  { id: 'GameBoy', label: 'Game Boy', desc: '8-bit, 11kHz' },
  { id: 'Atari', label: 'Atari 2600', desc: '8-bit, 4kHz' },
  { id: 'Arcade', label: 'Arcade', desc: '8-bit, 22kHz' },
  { id: 'Custom', label: 'Custom', desc: 'Custom Sample Rate' },
];

export function Controls() {
  const { file, preset, setPreset, status, convertedAudioUrl, customSettings, setCustomSettings } = useAppStore();
  const { isLoaded, convertAudio } = useFFmpeg();

  const handleConvert = () => {
    if (file) {
      convertAudio(file.name, preset, customSettings);
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

      {preset === 'Custom' && (
        <div className="mb-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-300 font-semibold tracking-wider">SAMPLE RATE (Hz)</label>
            <span className="text-accent pixel-font text-sm">{customSettings.sampleRate} Hz</span>
          </div>
          <input
            type="range"
            min="2000"
            max="44100"
            step="1000"
            value={customSettings.sampleRate}
            onChange={(e) => setCustomSettings({ sampleRate: Number(e.target.value) })}
            className="w-full accent-primary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            disabled={status === 'extracting' || status === 'converting'}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-2 uppercase tracking-wider font-bold">
            <span>Gritty (2kHz)</span>
            <span>Clean (44.1kHz)</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        {!isLoaded ? (
          <div className="text-amber-400 text-sm pixel-font animate-pulse">
            LOADING ENGINE...
          </div>
        ) : (
          <div className="flex gap-4 w-full">
            <button
              onClick={handleConvert}
              disabled={status === 'extracting' || status === 'converting' || status === 'idle'}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white py-3 px-6 rounded-lg font-bold tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {status === 'converting' ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span className="pixel-font text-xl mt-1">CONVERTING...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span className="pixel-font text-xl mt-1">
                    {status === 'ready_to_convert' ? 'START CONVERSION' : 'RE-CONVERT'}
                  </span>
                </>
              )}
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
