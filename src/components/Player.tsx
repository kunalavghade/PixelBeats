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

    // We only create AudioContext after user interaction, but since we are playing an object URL
    // it usually works. To be safe, we wrap it in a function triggered by play event.
    const setupAudio = () => {
      if (contextRef.current) return;
      
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      contextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyzerRef.current = analyser;

      if (audioRef.current) {
        sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
    };

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      if (!analyzerRef.current) return;
      
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        ctx.fillStyle = color;
        // Drawing retro pixelated bars
        const steps = Math.floor(barHeight / 4);
        for(let j=0; j<steps; j++) {
           ctx.fillRect(x, canvas.height - (j * 5), barWidth - 1, 4);
        }

        x += barWidth + 1;
      }
    };

    const handlePlay = () => {
      setupAudio();
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume();
      }
      draw();
    };

    const handlePause = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw flat line
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.fillRect(0, canvas.height / 2, canvas.width, 2);
    };

    const audioEl = audioRef.current;
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('ended', handlePause);
    
    // Draw initial flat line
    handlePause();

    return () => {
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('ended', handlePause);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl, color]);

  if (!audioUrl) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-black/50 border border-slate-700 rounded-lg p-2 h-24 overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full" width={300} height={80} />
        {/* CRT Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30"></div>
      </div>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        controls 
        className="w-full h-10 rounded outline-none custom-audio [&::-webkit-media-controls-panel]:bg-slate-800"
      />
    </div>
  );
}

export function Player() {
  const { status, audioUrl, convertedAudioUrl } = useAppStore();

  if (status === 'idle' || status === 'extracting' || status === 'converting' && !audioUrl) {
    return null;
  }

  return (
    <div className="glass-panel p-6 max-w-5xl mx-auto w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
        <Volume2 className="w-5 h-5 text-accent" />
        <h2 className="text-xl pixel-font text-white">AUDIO PLAYBACK</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="pixel-font text-slate-400">ORIGINAL AUDIO</h3>
            {audioUrl && (
              <a 
                href={audioUrl} 
                download="pixelbeats_original.mp3" 
                className="text-slate-400 hover:text-white transition-colors"
                title="Download Original"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
          <AudioVisualizer audioUrl={audioUrl} color="#94a3b8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="pixel-font text-primary flex items-center gap-2">
              8-BIT CONVERTED
              {status === 'converting' && <span className="animate-pulse text-xs text-amber-400">PROCESSING...</span>}
            </h3>
            {convertedAudioUrl && (
              <a 
                href={convertedAudioUrl} 
                download="pixelbeats_converted.wav" 
                className="text-primary hover:text-white transition-colors"
                title="Download Converted"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
          {convertedAudioUrl ? (
            <AudioVisualizer audioUrl={convertedAudioUrl} color="#8b5cf6" />
          ) : (
            <div className="h-[136px] bg-black/30 border border-slate-800 rounded-lg flex items-center justify-center crt-effect">
               <span className="pixel-font text-slate-600 animate-pulse">AWAITING SIGNAL...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
