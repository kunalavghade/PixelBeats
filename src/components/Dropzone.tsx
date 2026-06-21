import type React from 'react';
import { useCallback, useState } from 'react';
import { UploadCloud, FileAudio, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { generateSampleTrack } from '../lib/sampleGenerator';
import { cn } from '../utils';

const SAMPLE_FILENAME = 'pixelbeats_demo.wav';

export function Dropzone() {
  const { setFile, file, status } = useAppStore();
  const { extractOriginal } = useFFmpeg();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (status !== 'idle' && status !== 'done' && status !== 'error' && status !== 'ready_to_convert') return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const selectedFile = e.dataTransfer.files[0];
        setFile(selectedFile);
        extractOriginal(selectedFile);
      }
    },
    [setFile, extractOriginal, status]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        extractOriginal(selectedFile);
      }
    },
    [setFile, extractOriginal]
  );

  const [loadingSample, setLoadingSample] = useState(false);
  const loadSample = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (loadingSample) return;
      setLoadingSample(true);
      try {
        const blob = await generateSampleTrack();
        const sampleFile = new File([blob], SAMPLE_FILENAME, { type: 'audio/wav' });
        setFile(sampleFile);
        extractOriginal(sampleFile);
      } finally {
        setLoadingSample(false);
      }
    },
    [loadingSample, setFile, extractOriginal]
  );

  if (file && (status === 'extracting' || status === 'converting' || status === 'ready_to_convert')) {
    return null;
  }

  return (
    <div
      className={cn('cartridge-slot cursor-pointer flex-1 flex items-center justify-center', isDragActive && 'is-drag')}
      style={{
        padding: 'clamp(20px, 4vw, 44px)',
        minHeight: 'clamp(200px, 32vh, 360px)',
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="video/mp4,audio/*"
        onChange={onChange}
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
        <div className="relative float">
          <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-40" />
          {file ? (
            <FileAudio className="w-14 h-14 sm:w-16 sm:h-16 text-teal-300 relative z-10" />
          ) : (
            <UploadCloud className="w-14 h-14 sm:w-16 sm:h-16 text-violet-300 relative z-10" />
          )}
        </div>

        <h3
          className="pixel-font text-white text-center break-all neon-text-primary"
          style={{
            fontSize: 'clamp(20px, 3.6vw, 34px)',
            letterSpacing: '0.18em',
            lineHeight: 1.1,
          }}
        >
          {file ? (
            <span className="text-teal-200">{file.name.toUpperCase()}</span>
          ) : (
            <span className="insert-shimmer">INSERT CARTRIDGE</span>
          )}
        </h3>

        <p
          className="pixel-font text-slate-400 text-center"
          style={{ fontSize: 'clamp(11px, 1.4vw, 14px)', letterSpacing: '0.18em' }}
        >
          {file ? 'CLICK OR DRAG TO REPLACE FILE' : 'DROP MP4 OR AUDIO • OR CLICK TO BROWSE'}
        </p>

        {file ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 pixel-font text-teal-300 tracking-widest"
               style={{ fontSize: 'clamp(10px, 1.1vw, 12px)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            {(file.size / (1024 * 1024)).toFixed(2)} MB LOADED
          </div>
        ) : (
          <button
            type="button"
            onClick={loadSample}
            disabled={loadingSample}
            className={cn(
              'mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg pixel-font tracking-[0.2em]',
              'bg-violet-600/20 border-2 border-violet-500/60 text-violet-200',
              'hover:bg-violet-600/30 hover:border-violet-400 hover:text-white',
              'transition-colors shadow-[0_0_18px_rgba(139,92,246,0.35)]',
              loadingSample && 'opacity-60 cursor-not-allowed'
            )}
            style={{ fontSize: 'clamp(11px, 1.3vw, 13px)' }}
          >
            <Sparkles className="w-4 h-4" />
            {loadingSample ? 'GENERATING SAMPLE…' : 'TRY DEMO TRACK'}
          </button>
        )}
      </div>
    </div>
  );
}
