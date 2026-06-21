import { useCallback, useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { useAppStore, type Preset, type Mode } from '../store/useAppStore';

type PresetConfig = {
  rate: number;
  bits: number;
  lowpass: number;
  highpass: number;
};

const presetConfig: Record<Preset, PresetConfig> = {
  NES:     { rate: 8000,  bits: 4, lowpass: 2200, highpass: 90 },
  GameBoy: { rate: 11025, bits: 4, lowpass: 3500, highpass: 100 },
  Atari:   { rate: 4000,  bits: 3, lowpass: 1500, highpass: 60 },
  Arcade:  { rate: 22050, bits: 6, lowpass: 6000, highpass: 120 },
  Custom:  { rate: 16000, bits: 5, lowpass: 4000, highpass: 80 },
};

function buildFilterChain(cfg: PresetConfig, mode: Mode): string {
  const filters = [`highpass=f=${cfg.highpass}`];
  if (mode === 'chiptune') {
    // Heavy bitcrush + slight tremolo for that "console sample" character.
    filters.push(`acrusher=bits=${cfg.bits}:samples=2:mode=lin:aa=1`);
    filters.push(`tremolo=f=8:d=0.18`);
  } else {
    // Lo-fi: lighter crush, no tremolo.
    filters.push(`acrusher=bits=${cfg.bits + 2}:samples=1:mode=lin:aa=1`);
  }
  filters.push(`lowpass=f=${cfg.lowpass}`);
  filters.push(`acompressor=threshold=-18dB:ratio=4:attack=5:release=50`);
  return filters.join(',');
}

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

function getFFmpeg(): Promise<FFmpeg> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress }) => {
      useAppStore.getState().setProgress(Math.round(progress * 100));
    });
    await ffmpeg.load({ coreURL, wasmURL });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();
  return loadPromise;
}

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(ffmpegInstance !== null);
  const { setStatus, setProgress, setError, setConvertedAudioUrl, setAudioUrl } = useAppStore();

  const load = useCallback(async () => {
    try {
      await getFFmpeg();
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading ffmpeg', err);
      setError('Failed to load FFmpeg. Please ensure you are not blocking WebAssembly.');
    }
  }, [setError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const extractOriginal = async (file: File) => {
    if (!isLoaded || !ffmpegInstance) {
      setError('FFmpeg is not loaded yet');
      return;
    }

    const ffmpeg = ffmpegInstance;

    try {
      setStatus('extracting');
      setProgress(0);
      
      const fileName = file.name;
      const originalAudioName = 'original.mp3';

      // Write the file to memory
      await ffmpeg.writeFile(fileName, await fetchFile(file));

      // Extract original audio for preview
      await ffmpeg.exec(['-i', fileName, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', originalAudioName]);
      const originalData = await ffmpeg.readFile(originalAudioName);
      const originalBlob = new Blob([new Uint8Array(originalData as Uint8Array)], { type: 'audio/mpeg' });
      setAudioUrl(URL.createObjectURL(originalBlob));

      setStatus('ready_to_convert');
      setProgress(100);

    } catch (err) {
      console.error('Error during extraction', err);
      setError('An error occurred during audio extraction.');
      setStatus('error');
    }
  };

  const convertAudio = async (fileName: string, preset: Preset, mode: Mode, customSettings: { sampleRate: number }) => {
    if (!isLoaded || !ffmpegInstance) {
      setError('FFmpeg is not loaded yet');
      return;
    }

    const ffmpeg = ffmpegInstance;

    try {
      setStatus('converting');
      setProgress(0);

      const convertedAudioName = 'converted.wav';
      const baseCfg = presetConfig[preset];
      const cfg: PresetConfig =
        preset === 'Custom' ? { ...baseCfg, rate: customSettings.sampleRate } : baseCfg;
      const filterChain = buildFilterChain(cfg, mode);

      await ffmpeg.exec([
        '-i', fileName,
        '-vn',
        '-af', filterChain,
        '-ac', '1',
        '-acodec', 'pcm_u8',
        '-ar', String(cfg.rate),
        convertedAudioName,
      ]);

      const convertedData = await ffmpeg.readFile(convertedAudioName);
      const convertedBlob = new Blob([new Uint8Array(convertedData as Uint8Array)], { type: 'audio/wav' });
      setConvertedAudioUrl(URL.createObjectURL(convertedBlob));

      setStatus('done');
      setProgress(100);

    } catch (err) {
      console.error('Error during conversion', err);
      setError('An error occurred during audio processing.');
      setStatus('error');
    }
  };

  return { isLoaded, extractOriginal, convertAudio };
}
