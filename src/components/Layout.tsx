import type React from 'react';
import { Gamepad2 } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="stage">
      <div className="stage-grid" aria-hidden />
      <div className="stage-particles" aria-hidden />

      <main className="relative z-10 flex-1 min-h-0 flex flex-col px-3 sm:px-6 py-4 sm:py-6">
        <div className="cabinet flex-1 min-h-0 flex flex-col">
          <span className="rivet tl" aria-hidden />
          <span className="rivet tr" aria-hidden />
          <span className="rivet bl" aria-hidden />
          <span className="rivet br" aria-hidden />

          {/* Marquee */}
          <div className="marquee mb-3 sm:mb-5">
            <span className="chase-lights top" aria-hidden />
            <span className="chase-lights bottom" aria-hidden />

            <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 text-violet-300" />
              <h1
                className="pixel-font text-white neon-flicker"
                style={{
                  fontSize: 'clamp(28px, 6vw, 56px)',
                  letterSpacing: '0.18em',
                }}
              >
                PIXELBEATS
              </h1>
              <span className="power-led" aria-hidden />
            </div>
            <p
              className="pixel-font text-violet-200/80 mt-1 relative z-10"
              style={{
                fontSize: 'clamp(10px, 1.2vw, 13px)',
                letterSpacing: '0.4em',
              }}
            >
              ★ 8-BIT AUDIO ARCADE ★ INSERT MEDIA TO PLAY ★
            </p>
          </div>

          {/* CRT screen */}
          <div className="crt-screen flex-1 min-h-0 flex flex-col">
            <div className="crt-content flex flex-col">
              {children}
            </div>
          </div>

          {/* Cabinet base */}
          <div
            className="mt-3 sm:mt-5 px-1 flex flex-col sm:flex-row items-center justify-between gap-1 pixel-font text-slate-500"
            style={{
              fontSize: 'clamp(10px, 1.1vw, 12px)',
              letterSpacing: '0.2em',
            }}
          >
            <span>© PIXELBEATS ARCADE</span>
            <span>100% IN-BROWSER • NO UPLOADS</span>
            <span>V 1.0.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}
