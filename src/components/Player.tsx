import { useEffect, useRef } from 'react';
import { Volume2, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function AudioVisualizer({ audioUrl, color }: { audioUrl: string | null; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const contextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioUrl || !audioRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupAudio = () => {
      if (contextRef.current) return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      contextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyzerRef.current = analyser;
      if (audioRef.current) {
        sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
    };

    const fitCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      if (!analyzerRef.current) return;
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      const barWidth = (W / bufferLength) * 1.6;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * H * 0.9;
        const steps = Math.max(1, Math.floor(barHeight / 4));
        for (let j = 0; j < steps; j++) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.95 - (j / steps) * 0.5;
          ctx.fillRect(x, H - j * 5 - 4, barWidth - 1, 3);
        }
        ctx.globalAlpha = 1;
        x += barWidth + 1;
      }
    };

    const handlePlay = () => {
      setupAudio();
      if (contextRef.current?.state === 'suspended') contextRef.current.resume();
      fitCanvas();
      draw();
    };
    const handlePause = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(0, H / 2 - 1, W, 2);
      ctx.globalAlpha = 1;
    };

    const audioEl = audioRef.current;
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('ended', handlePause);
    fitCanvas();
    handlePause();

    const ro = new ResizeObserver(() => {
      fitCanvas();
      if (audioEl.paused) handlePause();
    });
    ro.observe(canvas.parentElement!);

    return () => {
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('ended', handlePause);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [audioUrl, color]);

  if (!audioUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="scope-frame h-16 sm:h-20">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
      <audio ref={audioRef} src={audioUrl} controls className="w-full h-9 rounded outline-none" />
    </div>
  );
}

function IdleScope() {
  return (
    <div className="scope-frame h-24 sm:h-28 flex items-end justify-center gap-1 px-4 py-3">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="scope-idle-bar"
          style={{ height: `${30 + (i % 5) * 14}%`, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function Player() {
  const { status, audioUrl, convertedAudioUrl } = useAppStore();

  if (status === 'idle' || status === 'extracting' || (status === 'converting' && !audioUrl)) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-[#06121b]/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Volume2 className="w-5 h-5 text-teal-300" />
        <h2 className="pixel-font text-white tracking-[0.18em] neon-text-accent"
            style={{ fontSize: 'clamp(16px, 2vw, 22px)' }}>
          ▸ SIGNAL OUT
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="pixel-font text-slate-400 tracking-widest text-sm">► ORIGINAL</h3>
            {audioUrl && (
              <a
                href={audioUrl}
                download="pixelbeats_original.mp3"
                className="text-slate-400 hover:text-white transition-colors"
                title="Download original"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
          <AudioVisualizer audioUrl={audioUrl} color="#94a3b8" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="pixel-font text-violet-300 tracking-widest text-sm flex items-center gap-2 neon-text-primary">
              ► 8-BIT
              {status === 'converting' && <span className="animate-pulse text-[11px] text-amber-300">PROCESSING…</span>}
            </h3>
            {convertedAudioUrl && (
              <a
                href={convertedAudioUrl}
                download="pixelbeats_converted.wav"
                className="text-violet-300 hover:text-white transition-colors"
                title="Download converted"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
          {convertedAudioUrl ? <AudioVisualizer audioUrl={convertedAudioUrl} color="#a78bfa" /> : <IdleScope />}
        </div>
      </div>
    </div>
  );
}
