import type React from 'react';
import { Gamepad2 } from 'lucide-react';


export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen crt-effect relative overflow-x-hidden flex flex-col">
      {/* Dynamic scanlines animation (CSS) */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      
      <header className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10 sticky top-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent glow-text">
              PixelBeats
            </h1>
          </div>
          <div className="text-sm text-slate-400 pixel-font tracking-widest hidden sm:block">
            V 1.0.0 // 8-BIT CONVERTER
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 z-10 flex flex-col">
        {children}
      </main>

      <footer className="p-6 text-center text-slate-500 text-sm pixel-font z-10">
        <p>ALL PROCESSING RUNS LOCALLY. NO FILES ARE UPLOADED TO CLOUD.</p>
      </footer>
    </div>
  );
}
