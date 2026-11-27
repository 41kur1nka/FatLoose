let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  // Play silent 1ms buffer to unlock iOS Safari Web Audio
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch {
    // ignore
  }
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  volume = 0.35,
  delaySec = 0
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playCountdownTick(enabled: boolean): void {
  if (!enabled) return;
  playTone(660, 0.11, 'sine', 0.3);
}

export function playGoSignal(enabled: boolean): void {
  if (!enabled) return;
  playTone(880, 0.16, 'triangle', 0.45, 0);
  playTone(1174.66, 0.28, 'triangle', 0.45, 0.12);
}

export function playRestSignal(enabled: boolean): void {
  if (!enabled) return;
  playTone(587.33, 0.18, 'sine', 0.38, 0);
  playTone(440, 0.28, 'sine', 0.35, 0.16);
}

export function playStepTransition(enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0.18, 'sine', 0.3, 0);
  playTone(783.99, 0.25, 'sine', 0.3, 0.14);
}

export function playFinishFanfare(enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0.16, 'triangle', 0.38, 0);
  playTone(659.25, 0.16, 'triangle', 0.38, 0.13);
  playTone(783.99, 0.16, 'triangle', 0.38, 0.26);
  playTone(1046.5, 0.42, 'triangle', 0.45, 0.39);
}
