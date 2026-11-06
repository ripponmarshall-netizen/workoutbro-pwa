import { MUSCLE_LABEL } from './exercises';
import { e1rm, isSetValid } from './game';
import type { Exercise, Mode, Muscle, Session, SetEntry } from './types';

const HOUR = 3_600_000;
/** Muscles a plan is built around, big groups first; core and cardio are added as finishers. */
const MAIN: Muscle[] = ['legs', 'back', 'chest', 'shoulders', 'full', 'arms'];
/** Past this many hours a muscle counts as fully recovered — more rest doesn't raise its priority. */
const RECOVERED_H = 48;

/** Hours since each muscle group last had a completed set (Infinity = never). */
export function muscleRest(sessions: Session[], exMap: Map<string, Exercise>, now: number): Record<Muscle, number> {
  const last: Partial<Record<Muscle, number>> = {};
  for (const s of sessions) {
    for (const we of s.exercises) {
      const ex = exMap.get(we.exerciseId);
      if (!ex || !we.sets.some((set) => isSetValid(set, ex))) continue;
      last[ex.muscle] = Math.max(last[ex.muscle] ?? 0, s.startedAt);
    }
  }
  const out = {} as Record<Muscle, number>;
  for (const m of Object.keys(MUSCLE_LABEL) as Muscle[]) {
    out[m] = last[m] ? (now - last[m]!) / HOUR : Infinity;
  }
  return out;
}

export interface Plan {
  mode: Mode;
  focus: Muscle[];
  exerciseIds: string[];
  reason: string;
}

/**
 * Builds a 5-exercise plan for a gate: the three most-rested main muscle groups,
 * favouring exercises the hunter already uses, plus a core/cardio finisher.
 */
export function recommendPlan(
  mode: Mode, sessions: Session[], all: Exercise[], exMap: Map<string, Exercise>, now: number,
): Plan {
  const rest = muscleRest(sessions, exMap, now);
  const usage = new Map<string, number>();
  for (const s of sessions) for (const we of s.exercises) usage.set(we.exerciseId, (usage.get(we.exerciseId) ?? 0) + 1);

  const pool = all.filter((e) => e.modes.includes(mode));
  const focus = MAIN.filter((m) => pool.some((e) => e.muscle === m))
    .sort((a, b) => Math.min(rest[b], RECOVERED_H) - Math.min(rest[a], RECOVERED_H) || MAIN.indexOf(a) - MAIN.indexOf(b))
    .slice(0, 3);

  const pick = (muscle: Muscle, n: number, taken: Set<string>) =>
    pool.filter((e) => e.muscle === muscle && !taken.has(e.id))
      .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
      .slice(0, n)
      .map((e) => e.id);

  const taken = new Set<string>();
  const ids: string[] = [];
  focus.forEach((m, i) => pick(m, i === 0 ? 2 : 1, taken).forEach((id) => { taken.add(id); ids.push(id); }));
  const finisher = rest.core >= rest.cardio ? 'core' : 'cardio';
  pick(finisher, 1, taken).forEach((id) => ids.push(id));

  const rested = focus.filter((m) => rest[m] >= RECOVERED_H);
  const reason = !sessions.length
    ? 'A balanced first Gate to set your baselines.'
    : rested.length
      ? `${rested.map((m) => MUSCLE_LABEL[m]).join(', ')} rested 48h+.`
      : 'Everything was trained recently — keep the effort moderate.';
  return { mode, focus, exerciseIds: ids, reason };
}

export interface Progression {
  /** What was done last time, e.g. "60 kg × 8" (weight in kg, formatted by caller) */
  last: SetEntry;
  next: Pick<SetEntry, 'weight' | 'reps' | 'seconds'>;
  why: string;
}

/**
 * Simple double progression: add reps until the top of the range, then add load.
 * Weight: 8+ reps last time → +2.5 kg (or +1 kg under 20 kg), else +1 rep.
 * Reps-only: +1 rep (+2 at 20+). Timed: +5 s (+10 s at 60 s+).
 */
export function progression(exerciseId: string, sessions: Session[], exMap: Map<string, Exercise>): Progression | null {
  const ex = exMap.get(exerciseId);
  if (!ex) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const we = sessions[i].exercises.find((e) => e.exerciseId === exerciseId);
    const sets = we?.sets.filter((s) => isSetValid(s, ex)) ?? [];
    if (!sets.length) continue;
    if (ex.track === 'weight') {
      const top = sets.reduce((a, b) => (e1rm(b.weight ?? 0, b.reps ?? 0) > e1rm(a.weight ?? 0, a.reps ?? 0) ? b : a));
      const w = top.weight ?? 0;
      const r = top.reps ?? 0;
      if (r >= 8 && w > 0) {
        const inc = w < 20 ? 1 : 2.5;
        return { last: top, next: { weight: w + inc, reps: Math.max(5, r - 2) }, why: `Hit ${r} reps — add load` };
      }
      return { last: top, next: { weight: w, reps: r + 1 }, why: 'Same load, one more rep' };
    }
    if (ex.track === 'reps') {
      const top = sets.reduce((a, b) => ((b.reps ?? 0) > (a.reps ?? 0) ? b : a));
      const r = top.reps ?? 0;
      return { last: top, next: { reps: r + (r >= 20 ? 2 : 1) }, why: 'Beat last time by a rep or two' };
    }
    const top = sets.reduce((a, b) => ((b.seconds ?? 0) > (a.seconds ?? 0) ? b : a));
    const sec = top.seconds ?? 0;
    return { last: top, next: { seconds: sec + (sec >= 60 ? 10 : 5) }, why: 'Hold a little longer' };
  }
  return null;
}
