import { create } from 'zustand';

export type Preset = 'NES' | 'GameBoy' | 'Atari' | 'Arcade' | 'Custom';

export interface AppState {
  file: File | null;
  videoUrl: string | null;
  audioUrl: string | null;
  convertedAudioUrl: string | null;
  status: 'idle' | 'extracting' | 'converting' | 'done' | 'error';
  progress: number;
  preset: Preset;
  error: string | null;
  
  setFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setAudioUrl: (url: string | null) => void;
  setConvertedAudioUrl: (url: string | null) => void;
  setStatus: (status: AppState['status']) => void;
  setProgress: (progress: number) => void;
  setPreset: (preset: Preset) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  file: null,
  videoUrl: null,
  audioUrl: null,
  convertedAudioUrl: null,
  status: 'idle',
  progress: 0,
  preset: 'NES',
  error: null,

  setFile: (file) => set({ file }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setConvertedAudioUrl: (url) => set({ convertedAudioUrl: url }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setPreset: (preset) => set({ preset }),
  setError: (error) => set({ error }),
  reset: () => set({
    file: null,
    videoUrl: null,
    audioUrl: null,
    convertedAudioUrl: null,
    status: 'idle',
    progress: 0,
    error: null,
  }),
}));
