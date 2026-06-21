import { useRef, useCallback, useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
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

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading ffmpeg', err);
      setError('Failed to load FFmpeg. Please ensure you are not blocking WebAssembly.');
    }
  }, [setError, setProgress]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, [load]);

  const processVideo = async (file: File, preset: Preset) => {
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
      const convertedAudioName = 'converted.wav';

      // Write the file to memory
      await ffmpeg.writeFile(fileName, await fetchFile(file));

      // Extract original audio for preview
      await ffmpeg.exec(['-i', fileName, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', originalAudioName]);
      const originalData = await ffmpeg.readFile(originalAudioName);
      const originalBlob = new Blob([new Uint8Array(originalData as Uint8Array)], { type: 'audio/mpeg' });
      setAudioUrl(URL.createObjectURL(originalBlob));

      setStatus('converting');
      setProgress(0);

      const sampleRate = presetSampleRates[preset];

      // Convert to 8-bit retro sound
      // We extract audio, downmix to mono, set sample format to unsigned 8-bit, and set sample rate
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

  return { isLoaded, processVideo };
}
