let audioCtx = null;
let audioUnlocked = false;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

export const isAudioUnlocked = () => audioUnlocked;

export const unlockAudio = () => {
  try {
    const ctx = getCtx();
    ctx.resume().then(() => { audioUnlocked = true; });
  } catch {}
};

export const disableAudio = () => { audioUnlocked = false; };

export const playBeep = () => {
  if (!audioUnlocked) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};
