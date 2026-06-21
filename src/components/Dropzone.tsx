import type React from 'react';
import { useCallback, useState } from 'react';
import { UploadCloud, FileAudio } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { cn } from '../utils';

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
      // Let user upload again even if done or error
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

  if (file && (status === 'extracting' || status === 'converting' || status === 'ready_to_convert')) {
    return null; // hide dropzone when processing or ready
  }

  return (
    <div className="w-full flex flex-col items-center justify-center my-8">
      <div
        className={cn(
          "glass-panel w-full max-w-xl p-10 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer group hover:bg-slate-800/80",
          isDragActive ? "border-primary bg-slate-800/80 scale-105" : "border-slate-600"
        )}
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
        
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          {file ? (
             <FileAudio className="w-20 h-20 text-accent relative z-10" />
          ) : (
             <UploadCloud className="w-20 h-20 text-primary relative z-10 group-hover:-translate-y-2 transition-transform duration-300" />
          )}
        </div>

        <h3 className="text-2xl mb-2 pixel-font text-white text-center">
          {file ? file.name : "INSERT COIN (UPLOAD MEDIA)"}
        </h3>
        
        <p className="text-slate-400 text-center text-sm font-medium">
          {file ? "Click or drag to change file" : "Drag and drop your MP4 or Audio file here, or click to browse"}
        </p>
        
        {file && (
          <div className="mt-4 px-3 py-1 bg-slate-800 rounded text-xs text-slate-300 font-mono">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        )}
      </div>
    </div>
  );
}
