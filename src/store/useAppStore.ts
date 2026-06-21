import { create } from 'zustand';

export type Preset = 'NES' | 'GameBoy' | 'Atari' | 'Arcade' | 'Custom';
// 'synth' is reserved for a future melody-extraction + chip-wave resynthesis path.
export type Mode = 'lofi' | 'chiptune' | 'synth';

export interface AppState {
  file: File | null;
  videoUrl: string | null;
  audioUrl: string | null;
  convertedAudioUrl: string | null;
  status: 'idle' | 'extracting' | 'ready_to_convert' | 'converting' | 'done' | 'error';
  progress: number;
  preset: Preset;
  mode: Mode;
  customSettings: { sampleRate: number };
  error: string | null;

  setFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setAudioUrl: (url: string | null) => void;
  setConvertedAudioUrl: (url: string | null) => void;
  setStatus: (status: AppState['status']) => void;
  setProgress: (progress: number) => void;
  setPreset: (preset: Preset) => void;
  setMode: (mode: Mode) => void;
  setCustomSettings: (settings: { sampleRate: number }) => void;
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
  mode: 'chiptune',
  customSettings: { sampleRate: 16000 },
  error: null,

  setFile: (file) => set({ file }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setConvertedAudioUrl: (url) => set({ convertedAudioUrl: url }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setPreset: (preset) => set({ preset }),
  setMode: (mode) => set({ mode }),
  setCustomSettings: (settings) => set({ customSettings: settings }),
  setError: (error) => set({ error }),
  reset: () => set({
    file: null,
    videoUrl: null,
    audioUrl: null,
    convertedAudioUrl: null,
    status: 'idle',
    progress: 0,
    preset: 'NES',
    mode: 'chiptune',
    customSettings: { sampleRate: 16000 },
    error: null,
  }),
}));
