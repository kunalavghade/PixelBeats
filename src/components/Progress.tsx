import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Progress() {
  const { status, progress, error } = useAppStore();

  if (status === 'idle' || status === 'done') {
    return null;
  }

  if (status === 'error') {
    return (
      <div className="max-w-3xl mx-auto w-full mt-6 bg-destructive/10 border border-destructive text-destructive px-6 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="pixel-font text-lg font-bold">SYSTEM ERROR</h4>
          <p className="text-sm font-medium">{error || "An unknown error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 max-w-3xl mx-auto w-full mt-6 animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-accent animate-pulse" />
        <h2 className="text-xl pixel-font text-white uppercase">
          {status === 'extracting' ? 'EXTRACTING AUDIO...' : 'APPLYING 8-BIT FILTERS...'}
        </h2>
      </div>

      <div className="w-full h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative crt-effect">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out flex items-center justify-end px-2"
          style={{ width: `${Math.max(5, progress)}%` }}
        >
          {/* Animated stripes */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs pixel-font text-slate-400">
        <span>0%</span>
        <span className="text-white text-sm">{progress}%</span>
        <span>100%</span>
      </div>
      
      <style>{`
        @keyframes progress {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}
