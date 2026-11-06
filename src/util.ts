import type { Profile, Track } from './engine/types';

const LB = 2.20462;

export const toUnit = (kg: number | undefined, unit: Profile['unit']) =>
  kg == null ? '' : String(Math.round((unit === 'lb' ? kg * LB : kg) * 10) / 10);

export const inUnit = (kg: number, unit: Profile['unit']) => Math.round((unit === 'lb' ? kg * LB : kg) * 10) / 10;

/** "60 kg × 8", "25 reps", "45s" */
export function fmtSet(s: { weight?: number; reps?: number; seconds?: number }, track: Track, unit: Profile['unit']) {
  if (track === 'time') return `${s.seconds ?? 0}s`;
  if (track === 'reps') return `${s.reps ?? 0} reps`;
  return `${inUnit(s.weight ?? 0, unit)} ${unit} × ${s.reps ?? 0}`;
}

export const fromUnit = (v: number, unit: Profile['unit']) => (unit === 'lb' ? v / LB : v);

export const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

export function fmtVolume(kg: number, unit: Profile['unit']) {
  const v = unit === 'lb' ? kg * LB : kg;
  if (v < 10_000) return `${fmt(v)} ${unit}`;
  return unit === 'lb' ? `${(v / 1000).toFixed(1)}k lb` : `${(v / 1000).toFixed(1)} t`;
}

export function fmtClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* Tiny synthesised chime — no audio files needed. iOS only plays after a user tap. */
let ctx: AudioContext | null = null;
export type ChimeKind = 'level' | 'badge' | 'rest' | 'tap' | 'gate' | 'clear' | 'quest';
export function chime(kind: ChimeKind = 'tap') {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const notes = {
      level: [523, 659, 784, 1047], badge: [659, 988], rest: [880, 0, 880], tap: [740],
      gate: [196, 294, 392], clear: [392, 523, 659, 784], quest: [784, 988, 1175],
    }[kind];
    notes.forEach((freq, i) => {
      if (!freq) return;
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const t = ctx!.currentTime + i * 0.11;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* audio unavailable */
  }
}

export function buzz(ms = 30) {
  try { navigator.vibrate?.(ms); } catch { /* iOS has no vibrate API */ }
}
