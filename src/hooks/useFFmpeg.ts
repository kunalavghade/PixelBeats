import { useRef, useCallback, useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { useAppStore, type Preset } from '../store/useAppStore';

const presetSampleRates: Record<Preset, string> = {
  NES: '8000',
  GameBoy: '11025',
  Atari: '4000',
  Arcade: '22050',
  Custom: '16000',
};

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setStatus, setProgress, setError, setConvertedAudioUrl, setAudioUrl } = useAppStore();

  const load = useCallback(async () => {
    if (ffmpegRef.current) return;
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress }) => {
        // Progress goes from 0 to 1
        setProgress(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
      
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading ffmpeg', err);
      setError('Failed to load FFmpeg. Please ensure you are not blocking WebAssembly.');
    }
  }, [setError, setProgress]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const extractOriginal = async (file: File) => {
    if (!isLoaded || !ffmpegRef.current) {
      setError('FFmpeg is not loaded yet');
      return;
    }

    const ffmpeg = ffmpegRef.current;
    
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

  const convertAudio = async (fileName: string, preset: Preset, customSettings: { sampleRate: number }) => {
    if (!isLoaded || !ffmpegRef.current) {
      setError('FFmpeg is not loaded yet');
      return;
    }

    const ffmpeg = ffmpegRef.current;

    try {
      setStatus('converting');
      setProgress(0);

      const convertedAudioName = 'converted.wav';
      const sampleRate = preset === 'Custom' ? customSettings.sampleRate.toString() : presetSampleRates[preset];

      // Convert to 8-bit retro sound
      await ffmpeg.exec([
        '-i', fileName,
        '-vn', // no video
        '-ac', '1', // mono channel
        '-acodec', 'pcm_u8', // 8-bit PCM
        '-ar', sampleRate, // preset sample rate
        convertedAudioName
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
