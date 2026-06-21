import { useState } from 'react';
import { useAppStore, type Preset } from '../store/useAppStore';

// ============================================================
//  Pitch tracking (monophonic, YIN-style)
// ============================================================

const PITCH_SAMPLE_RATE = 8000;
const WINDOW_SIZE = 1024;
const HOP_SIZE = 256;
const MIN_FREQ = 90;   // ~F#2
const MAX_FREQ = 1200; // ~D6
const YIN_THRESHOLD = 0.15;
const RMS_GATE = 0.008;

function mixToMono(buf: AudioBuffer): Float32Array {
  const ch = buf.numberOfChannels;
  if (ch === 1) return buf.getChannelData(0);
  const len = buf.length;
  const out = new Float32Array(len);
  for (let c = 0; c < ch; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += data[i] / ch;
  }
  return out;
}

function downsample(buf: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buf;
  const ratio = fromRate / toRate;
  const newLen = Math.floor(buf.length / ratio);
  const out = new Float32Array(newLen);
  // Box-average filter to avoid aliasing
  const step = Math.max(1, Math.floor(ratio));
  for (let i = 0; i < newLen; i++) {
    const start = Math.floor(i * ratio);
    let sum = 0;
    let count = 0;
    for (let k = 0; k < step && start + k < buf.length; k++) {
      sum += buf[start + k];
      count++;
    }
    out[i] = count > 0 ? sum / count : 0;
  }
  return out;
}

function detectPitchYin(buf: Float32Array, sampleRate: number): number {
  const maxTau = Math.min(buf.length - 1, Math.floor(sampleRate / MIN_FREQ));
  const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQ));

  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < RMS_GATE) return 0;

  // Difference function d(τ) — Σ (x[j] - x[j+τ])²
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    const limit = buf.length - tau;
    for (let j = 0; j < limit; j++) {
      const diff = buf[j] - buf[j + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  // Cumulative mean normalized difference d'(τ)
  const dp = new Float32Array(maxTau + 1);
  dp[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau];
    dp[tau] = (d[tau] * tau) / (running || 1);
  }

  // First τ ≥ minTau where d'(τ) < threshold and is a local min
  for (let tau = minTau; tau < maxTau; tau++) {
    if (dp[tau] < YIN_THRESHOLD) {
      while (tau + 1 < maxTau && dp[tau + 1] < dp[tau]) tau++;
      // Parabolic interpolation
      let bestTau = tau;
      if (tau > 1 && tau < maxTau) {
        const s0 = dp[tau - 1];
        const s1 = dp[tau];
        const s2 = dp[tau + 1];
        const denom = 2 * (s0 - 2 * s1 + s2);
        if (denom !== 0) bestTau = tau + (s0 - s2) / denom;
      }
      return sampleRate / bestTau;
    }
  }
  return 0;
}

// ============================================================
//  Note quantization
// ============================================================

interface Note {
  midi: number;
  freq: number;
  start: number; // seconds
  end: number;
}

function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function quantizeToNotes(pitches: number[], hopDuration: number): Note[] {
  const notes: Note[] = [];
  let current: { midi: number; start: number } | null = null;

  const finalize = (endTime: number) => {
    if (!current) return;
    notes.push({
      midi: current.midi,
      freq: midiToFreq(current.midi),
      start: current.start,
      end: endTime,
    });
    current = null;
  };

  pitches.forEach((freq, i) => {
    const time = i * hopDuration;
    if (freq === 0) {
      finalize(time);
      return;
    }
    const midi = freqToMidi(freq);
    if (current && current.midi === midi) return;
    finalize(time);
    current = { midi, start: time };
  });
  finalize(pitches.length * hopDuration);

  // Median filter to kill 1-window glitches and stitch tiny gaps
  const MIN_NOTE_DUR = 0.07;
  const merged: Note[] = [];
  for (const n of notes) {
    if (n.end - n.start < MIN_NOTE_DUR) continue;
    const prev = merged[merged.length - 1];
    if (prev && prev.midi === n.midi && n.start - prev.end < 0.04) {
      prev.end = n.end;
    } else {
      merged.push({ ...n });
    }
  }
  return merged;
}

// ============================================================
//  Chip-wave rendering
// ============================================================

function square(t: number, freq: number, duty = 0.5): number {
  return ((t * freq) % 1) < duty ? 1 : -1;
}
function triangle(t: number, freq: number): number {
  const phase = (t * freq) % 1;
  return phase < 0.5 ? -1 + 4 * phase : 3 - 4 * phase;
}
function sawtooth(t: number, freq: number): number {
  const phase = (t * freq) % 1;
  return 2 * phase - 1;
}

type Voice = (t: number, freq: number) => number;

function voiceFor(preset: Preset, customDuty: number): Voice {
  switch (preset) {
    case 'NES':
      // Two NES pulse channels: 50% + 25% duty for that classic stab
      return (t, f) => 0.6 * square(t, f, 0.5) + 0.4 * square(t, f, 0.25);
    case 'GameBoy':
      // GB wave channel — triangle dominant + soft square detune
      return (t, f) => 0.7 * triangle(t, f) + 0.3 * square(t, f * 1.005, 0.5);
    case 'Atari':
      // Atari TIA — square with heavy bitcrush done in post
      return (t, f) => square(t, f, 0.5);
    case 'Arcade':
      // Two stacked oscillators, octave apart, square + saw
      return (t, f) => 0.55 * square(t, f, 0.5) + 0.35 * sawtooth(t, f / 2) + 0.2 * square(t, f * 2, 0.5);
    case 'Custom':
      return (t, f) => square(t, f, customDuty);
  }
}

function renderSynth(
  notes: Note[],
  durationSec: number,
  sampleRate: number,
  preset: Preset,
  customDuty: number,
): Float32Array {
  const total = Math.ceil(durationSec * sampleRate);
  const out = new Float32Array(total);
  const voice = voiceFor(preset, customDuty);
  const attack = Math.floor(sampleRate * 0.006);
  const release = Math.floor(sampleRate * 0.025);

  for (const note of notes) {
    const startIdx = Math.max(0, Math.floor(note.start * sampleRate));
    const endIdx = Math.min(total, Math.floor(note.end * sampleRate));
    const len = endIdx - startIdx;
    if (len <= 0) continue;
    const aSamples = Math.min(attack, Math.floor(len / 3));
    const rSamples = Math.min(release, Math.floor(len / 3));
    const sustainLevel = 0.78;

    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      let env: number;
      if (i < aSamples) {
        env = i / aSamples;
      } else if (i > len - rSamples) {
        env = ((len - i) / rSamples) * sustainLevel;
      } else {
        env = sustainLevel;
      }
      out[startIdx + i] += voice(t, note.freq) * env * 0.32;
    }
  }

  // Atari: aggressive 3-bit crush after summing
  if (preset === 'Atari') {
    const steps = 6;
    for (let i = 0; i < out.length; i++) {
      out[i] = Math.round(out[i] * steps) / steps;
    }
  }

  // Soft clip everything so summed voices never explode
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.tanh(out[i] * 1.1);
  }

  return out;
}

// ============================================================
//  WAV encoding (16-bit PCM mono)
// ============================================================

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);     // PCM
  view.setUint16(22, 1, true);     // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

// ============================================================
//  Hook
// ============================================================

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

export function useChiptuneSynth() {
  const [isProcessing, setIsProcessing] = useState(false);

  const synthesize = async (file: File, preset: Preset, customSettings: { sampleRate: number }) => {
    const { setStatus, setProgress, setConvertedAudioUrl, setError } = useAppStore.getState();
    setIsProcessing(true);
    setStatus('converting');
    setProgress(0);

    try {
      // 1. Decode
      const arrayBuf = await file.arrayBuffer();
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const decodeCtx = new AudioContextClass();
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuf);
      await decodeCtx.close();
      setProgress(8);
      await yieldToMain();

      // 2. Mono + downsample for pitch tracking
      const mono = mixToMono(audioBuffer);
      const pitchBuf = downsample(mono, audioBuffer.sampleRate, PITCH_SAMPLE_RATE);
      setProgress(15);
      await yieldToMain();

      // 3. YIN per window (chunked, yields to UI)
      const totalWindows = Math.max(0, Math.floor((pitchBuf.length - WINDOW_SIZE) / HOP_SIZE));
      const pitches = new Array<number>(totalWindows);
      const CHUNK = 150;
      for (let start = 0; start < totalWindows; start += CHUNK) {
        const end = Math.min(start + CHUNK, totalWindows);
        for (let i = start; i < end; i++) {
          const win = pitchBuf.subarray(i * HOP_SIZE, i * HOP_SIZE + WINDOW_SIZE);
          pitches[i] = detectPitchYin(win, PITCH_SAMPLE_RATE);
        }
        setProgress(15 + Math.round((end / totalWindows) * 60));
        await yieldToMain();
      }

      // 4. Quantize
      const hopDuration = HOP_SIZE / PITCH_SAMPLE_RATE;
      const notes = quantizeToNotes(pitches, hopDuration);
      setProgress(80);
      await yieldToMain();

      if (notes.length === 0) {
        setError('No melody detected. Try a track with a clearer lead vocal or melody.');
        setStatus('error');
        return;
      }

      // 5. Render chip waveforms
      const outRate = 22050;
      const customDuty = Math.max(0.1, Math.min(0.9, customSettings.sampleRate / 88200 + 0.25));
      const samples = renderSynth(notes, audioBuffer.duration, outRate, preset, customDuty);
      setProgress(94);
      await yieldToMain();

      // 6. Encode + emit
      const blob = encodeWav(samples, outRate);
      const url = URL.createObjectURL(blob);
      setConvertedAudioUrl(url);
      setStatus('done');
      setProgress(100);
    } catch (err) {
      console.error('Chiptune synth error', err);
      setError('Synth failed: ' + ((err as Error).message || 'unknown error'));
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, synthesize };
}
