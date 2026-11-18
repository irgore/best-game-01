// All sound is synthesised with the Web Audio API, so the game ships no audio files: a shot, a
// hull popping, the core taking a hit, a dash, a wave cleared fanfare and a low core alarm.

let ctx = null;
let master = null;

function ensure() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

function blip(freq, endFreq, length, type, gain) {
  const audio = ensure();
  if (!audio) return;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), audio.currentTime + length);
  env.gain.setValueAtTime(gain, audio.currentTime);
  env.gain.exponentialRampToValueAtTime(0.0008, audio.currentTime + length);
  osc.connect(env);
  env.connect(master);
  osc.start();
  osc.stop(audio.currentTime + length);
}

function noise(length, gain) {
  const audio = ensure();
  if (!audio) return;
  const frames = Math.floor(audio.sampleRate * length);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = audio.createBufferSource();
  const env = audio.createGain();
  src.buffer = buffer;
  env.gain.value = gain;
  src.connect(env);
  env.connect(master);
  src.start();
}

export const sfx = {
  resume() {
    const audio = ensure();
    if (audio && audio.state === 'suspended') audio.resume();
  },
  shoot() { blip(720, 380, 0.06, 'square', 0.09); },
  hit() { blip(320, 180, 0.05, 'triangle', 0.12); },
  kill() { noise(0.16, 0.18); blip(220, 70, 0.16, 'sawtooth', 0.09); },
  dash() { blip(180, 620, 0.14, 'sine', 0.1); },
  coreHit() { blip(120, 46, 0.3, 'sawtooth', 0.2); noise(0.12, 0.12); },
  waveClear() {
    blip(520, 780, 0.12, 'sine', 0.12);
    setTimeout(() => blip(780, 1040, 0.16, 'sine', 0.12), 110);
  },
  upgrade() { blip(440, 880, 0.18, 'triangle', 0.13); },
  over() {
    blip(300, 90, 0.5, 'sawtooth', 0.18);
    setTimeout(() => blip(200, 55, 0.7, 'sawtooth', 0.16), 220);
  },
};
