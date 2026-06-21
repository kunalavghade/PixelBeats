import { Activity, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const TOTAL_CELLS = 20;

export function Progress() {
  const { status, progress, error, mode } = useAppStore();

  if (status === 'idle' || status === 'done' || status === 'ready_to_convert') {
    return null;
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border-2 border-red-500/70 bg-red-500/10 px-5 py-4 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
        <div>
          <h4 className="pixel-font text-lg text-red-300 tracking-widest neon-text-red">SYSTEM ERROR</h4>
          <p className="text-sm text-red-200/80">{error || 'An unknown error occurred.'}</p>
        </div>
      </div>
    );
  }

  const filled = Math.round((progress / 100) * TOTAL_CELLS);

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-[#06121b]/70 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-teal-300 animate-pulse" />
        <h2 className="pixel-font text-lg text-white tracking-[0.18em]">
          {status === 'extracting'
            ? 'EXTRACTING AUDIO…'
            : mode === 'synth'
              ? 'TRANSCRIBING MELODY…'
              : 'APPLYING 8-BIT FILTERS…'}
        </h2>
        <span className="ml-auto pixel-font text-teal-300 tracking-widest neon-text-accent">{progress}%</span>
      </div>

      <div className="pixel-bar">
        {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
          <div key={i} className={`cell ${i < filled ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  );
}
