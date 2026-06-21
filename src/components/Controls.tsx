import { Download, Play } from 'lucide-react';
import { useAppStore, type Preset, type Mode } from '../store/useAppStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { useChiptuneSynth } from '../hooks/useChiptuneSynth';
import { cn } from '../utils';

type PresetMeta = { id: Preset; label: string; desc: string; color: string; icon: string };

const presets: PresetMeta[] = [
  { id: 'NES',     label: 'NES',     desc: '8-BIT • 8 KHZ',  color: '#ef4444', icon: '🎮' },
  { id: 'GameBoy', label: 'GAMEBOY', desc: '8-BIT • 11 KHZ', color: '#84cc16', icon: '👾' },
  { id: 'Atari',   label: 'ATARI',   desc: '3-BIT • 4 KHZ',  color: '#f59e0b', icon: '🕹️' },
  { id: 'Arcade',  label: 'ARCADE',  desc: '6-BIT • 22 KHZ', color: '#22d3ee', icon: '🎰' },
  { id: 'Custom',  label: 'CUSTOM',  desc: 'TUNE IT',         color: '#a78bfa', icon: '🎛️' },
];

const modes: { id: Mode; label: string; tooltip?: string }[] = [
  { id: 'lofi', label: 'LO-FI', tooltip: 'Crunchy bit-reduced filter chain' },
  { id: 'chiptune', label: 'CHIPTUNE', tooltip: 'Aggressive bitcrush + tremolo' },
  { id: 'synth', label: 'SYNTH', tooltip: 'Melody → chip-wave resynthesis (best with vocal lines)' },
];

export function Controls() {
  const {
    file, preset, setPreset, status, convertedAudioUrl,
    customSettings, setCustomSettings, mode, setMode,
  } = useAppStore();
  const { isLoaded, convertAudio } = useFFmpeg();
  const { synthesize } = useChiptuneSynth();

  const handleConvert = () => {
    if (!file) return;
    if (mode === 'synth') {
      synthesize(file, preset, customSettings);
    } else {
      convertAudio(file.name, preset, mode, customSettings);
    }
  };

  const handleDownload = () => {
    if (!convertedAudioUrl) return;
    const a = document.createElement('a');
    a.href = convertedAudioUrl;
    a.download = `pixelbeats_${preset.toLowerCase()}_${mode}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!file) return null;

  const busy = status === 'extracting' || status === 'converting';

  return (
    <div className="control-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2
          className="pixel-font text-white tracking-[0.18em] neon-text-accent"
          style={{ fontSize: 'clamp(18px, 2.4vw, 26px)' }}
        >
          ▸ CONTROL PANEL
        </h2>
        <div className="mode-toggle self-start sm:self-auto">
          {modes.map((m) => (
            <button
              key={m.id}
              disabled={busy}
              onClick={() => setMode(m.id)}
              className={cn(mode === m.id && 'active')}
              title={m.tooltip}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-5">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            disabled={busy}
            className={cn('arcade-btn', preset === p.id && 'is-active')}
            style={{ ['--btn-color' as string]: p.color }}
          >
            <span aria-hidden style={{ fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1 }}>{p.icon}</span>
            <span className="btn-label">{p.label}</span>
            <span className="btn-desc">{p.desc}</span>
          </button>
        ))}
      </div>

      {preset === 'Custom' && (
        <div className="mb-5 p-4 rounded-lg bg-[#0b1220] border border-slate-700">
          <div className="flex justify-between items-center mb-2 pixel-font tracking-widest">
            <label className="text-slate-300 text-sm">SAMPLE RATE</label>
            <span className="text-teal-300 text-sm neon-text-accent">{customSettings.sampleRate} HZ</span>
          </div>
          <input
            type="range"
            min={2000}
            max={44100}
            step={500}
            value={customSettings.sampleRate}
            onChange={(e) => setCustomSettings({ sampleRate: Number(e.target.value) })}
            disabled={busy}
            className="w-full accent-violet-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] pixel-font text-slate-500 mt-2 tracking-widest">
            <span>GRITTY (2K)</span>
            <span>CLEAN (44.1K)</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <button
          onClick={handleConvert}
          disabled={!isLoaded || busy || status === 'idle'}
          className="start-btn pixel-font flex-1 flex items-center justify-center gap-3"
          style={{ fontSize: 'clamp(18px, 2.6vw, 26px)', letterSpacing: '0.3em' }}
        >
          {!isLoaded ? (
            <span className="animate-pulse">LOADING ENGINE…</span>
          ) : status === 'converting' ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>CONVERTING…</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{status === 'ready_to_convert' ? 'START' : 'RE-CONVERT'}</span>
            </>
          )}
        </button>

        {status === 'done' && convertedAudioUrl && (
          <button
            onClick={handleDownload}
            className="save-btn pixel-font flex items-center justify-center gap-2"
            style={{ fontSize: 'clamp(16px, 2.2vw, 22px)', letterSpacing: '0.3em' }}
          >
            <Download className="w-5 h-5" />
            SAVE
          </button>
        )}
      </div>
    </div>
  );
}
