// Renders a short royalty-free demo track using Web Audio.
// 8 bars at 100 BPM in C major, four-chord progression (I-V-vi-IV).
// Saw lead + triangle bass + noise hi-hats — distinct from chiptune output
// so the SYNTH mode visibly transforms it.

const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const SAMPLE_RATE = 22050;

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// 4-chord progression, 1 bar each, played twice = 8 bars (~19 s)
// Each entry: [rootMidi, leadMelodyMidi[]] where leadMelodyMidi is 8 eighth notes
const PROGRESSION: { root: number; lead: number[] }[] = [
  { root: 48, lead: [72, 76, 79, 84, 83, 79, 76, 74] }, // C major
  { root: 43, lead: [67, 71, 74, 79, 78, 74, 71, 69] }, // G major
  { root: 45, lead: [69, 72, 76, 81, 79, 76, 72, 71] }, // A minor
  { root: 41, lead: [65, 69, 72, 77, 76, 72, 69, 67] }, // F major
];

function scheduleLead(ctx: OfflineAudioContext, midi: number, start: number, end: number, master: GainNode) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = midiToFreq(midi);

  // Slight detune for richness
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = midiToFreq(midi) * 1.006;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  lp.Q.value = 0.6;

  const gain = ctx.createGain();
  const a = 0.012;
  const r = 0.06;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + a);
  gain.gain.setValueAtTime(0.16, Math.max(start + a, end - r));
  gain.gain.linearRampToValueAtTime(0, end);

  osc.connect(lp);
  osc2.connect(lp);
  lp.connect(gain).connect(master);
  osc.start(start); osc.stop(end);
  osc2.start(start); osc2.stop(end);
}

function scheduleBass(ctx: OfflineAudioContext, midi: number, start: number, end: number, master: GainNode) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = midiToFreq(midi);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.32, start + 0.015);
  gain.gain.setValueAtTime(0.22, end - 0.12);
  gain.gain.linearRampToValueAtTime(0, end);

  osc.connect(gain).connect(master);
  osc.start(start); osc.stop(end);
}

function scheduleKick(ctx: OfflineAudioContext, time: number, master: GainNode) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  osc.connect(gain).connect(master);
  osc.start(time); osc.stop(time + 0.2);
}

function scheduleHat(ctx: OfflineAudioContext, time: number, master: GainNode) {
  const length = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;

  const gain = ctx.createGain();
  gain.gain.value = 0.08;

  noise.connect(hp).connect(gain).connect(master);
  noise.start(time);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const write = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}

let cachedBlob: Blob | null = null;

export async function generateSampleTrack(): Promise<Blob> {
  if (cachedBlob) return cachedBlob;

  const cycles = 2;
  const totalDuration = BAR * PROGRESSION.length * cycles;
  const ctx = new OfflineAudioContext(1, Math.ceil(totalDuration * SAMPLE_RATE), SAMPLE_RATE);

  // Master bus with mild lowpass to soften
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  // Lead + bass per chord
  let barTime = 0;
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const { root, lead } of PROGRESSION) {
      // Bass: hold root for almost the whole bar
      scheduleBass(ctx, root, barTime, barTime + BAR - 0.02, master);

      // Lead: 8 eighth notes, 92% legato
      const eighth = BEAT / 2;
      for (let i = 0; i < lead.length; i++) {
        const noteStart = barTime + i * eighth;
        const noteEnd = noteStart + eighth * 0.92;
        scheduleLead(ctx, lead[i], noteStart, noteEnd, master);
      }
      barTime += BAR;
    }
  }

  // Drum loop: kick on 1 and 3, hat on offbeats
  const totalBeats = Math.floor(totalDuration / BEAT);
  for (let b = 0; b < totalBeats; b++) {
    const t = b * BEAT;
    if (b % 4 === 0 || b % 4 === 2) scheduleKick(ctx, t, master);
    if (b % 2 === 1) scheduleHat(ctx, t + BEAT * 0.5, master);
  }

  const rendered = await ctx.startRendering();
  const samples = rendered.getChannelData(0);

  // Soft clip to keep peaks tame
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.tanh(samples[i] * 1.1);
  }

  cachedBlob = encodeWav(samples, SAMPLE_RATE);
  return cachedBlob;
}
