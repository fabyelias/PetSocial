// Notification and chat sounds using Web Audio API (no external files needed)

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

async function ensureAudioReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx;
}

function playTone(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/** Friendly two-tone chime for notifications (like, comment, follow) */
export async function playNotificationSound() {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  playTone(ctx, 880, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(ctx, 1175, 0.2, 'sine', 0.15), 120);
}

/** Soft pop sound for new chat messages */
export async function playMessageSound() {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  playTone(ctx, 660, 0.12, 'sine', 0.2);
}
