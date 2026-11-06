import { useSyncExternalStore } from 'react';
import { newlyUnlocked, type Badge } from './engine/badges';
import { exerciseMap } from './engine/exercises';
import {
  computeBests, dailyQuests, dateKey, findPrs, questBonus, sessionXp, summarise,
  type Summary,
} from './engine/game';
import type { ActiveWorkout, AppState, Exercise, Mode, Profile, Session, SetEntry } from './engine/types';

const KEY = 'workoutbro.hunter.v1';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function fresh(): AppState {
  return {
    version: 1,
    profile: { name: 'Hunter', unit: 'kg', sound: true, weeklyGoal: 3, title: null },
    sessions: [],
    customExercises: [],
    active: null,
    badges: {},
    questClaims: {},
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = fresh();
    return { ...base, ...parsed, profile: { ...base.profile, ...parsed.profile } } as AppState;
  } catch {
    return fresh();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode — keep running in memory */
  }
}

function set(next: AppState) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );
}

export const getState = () => state;

/* ------------------------------------------------------------------ */
/* Reward events (level-ups, badges, rank-ups) for the overlay          */
/* ------------------------------------------------------------------ */

export type Reward =
  | { kind: 'level'; level: number }
  | { kind: 'rank'; rank: string; title: string }
  | { kind: 'badge'; badge: Badge };

let rewards: Reward[] = [];
const rewardListeners = new Set<() => void>();

function pushRewards(r: Reward[]) {
  if (!r.length) return;
  rewards = [...rewards, ...r];
  rewardListeners.forEach((l) => l());
}

export function useRewards(): [Reward | undefined, () => void] {
  const queue = useSyncExternalStore(
    (l) => { rewardListeners.add(l); return () => rewardListeners.delete(l); },
    () => rewards,
  );
  return [queue[0], () => { rewards = rewards.slice(1); rewardListeners.forEach((l) => l()); }];
}

/** Apply a state change, then detect level/rank-ups and new badges. */
function commit(next: AppState): Reward[] {
  const map = exerciseMap(next.customExercises);
  const before = summarise(state, exerciseMap(state.customExercises));
  const after = summarise(next, map);
  const out: Reward[] = [];
  if (after.level.level > before.level.level) out.push({ kind: 'level', level: after.level.level });
  if (after.rank.id !== before.rank.id && after.level.level > before.level.level) {
    out.push({ kind: 'rank', rank: after.rank.id, title: after.rank.title });
  }
  const unlocked = newlyUnlocked(after, next.badges);
  if (unlocked.length) {
    const now = Date.now();
    next = { ...next, badges: { ...next.badges, ...Object.fromEntries(unlocked.map((b) => [b.id, now])) } };
    unlocked.forEach((badge) => out.push({ kind: 'badge', badge }));
  }
  set(next);
  pushRewards(out);
  return out;
}

/* ------------------------------------------------------------------ */
/* Active workout                                                      */
/* ------------------------------------------------------------------ */

function patchActive(fn: (a: ActiveWorkout) => ActiveWorkout) {
  if (!state.active) return;
  set({ ...state, active: fn(state.active) });
}

export const actions = {
  startWorkout(mode: Mode) {
    if (state.active) return;
    set({ ...state, active: { id: uid(), mode, startedAt: Date.now(), exercises: [] } });
  },

  addExercise(exerciseId: string) {
    const ex = exerciseMap(state.customExercises).get(exerciseId);
    if (!ex) return;
    // Pre-fill from the last time this exercise was done
    const last = [...state.sessions].reverse().find((s) => s.exercises.some((e) => e.exerciseId === exerciseId));
    const lastSet = last?.exercises.find((e) => e.exerciseId === exerciseId)?.sets.slice(-1)[0];
    const first: SetEntry = {
      id: uid(), done: false,
      weight: ex.track === 'weight' ? lastSet?.weight ?? 0 : undefined,
      reps: ex.track !== 'time' ? lastSet?.reps ?? 10 : undefined,
      seconds: ex.track === 'time' ? lastSet?.seconds ?? 30 : undefined,
    };
    patchActive((a) => ({ ...a, exercises: [...a.exercises, { exerciseId, sets: [first] }] }));
  },

  removeExercise(index: number) {
    patchActive((a) => ({ ...a, exercises: a.exercises.filter((_, i) => i !== index) }));
  },

  addSet(exIndex: number) {
    patchActive((a) => ({
      ...a,
      exercises: a.exercises.map((we, i) => {
        if (i !== exIndex) return we;
        const prev = we.sets[we.sets.length - 1];
        return { ...we, sets: [...we.sets, { ...(prev ?? {}), id: uid(), done: false }] };
      }),
    }));
  },

  updateSet(exIndex: number, setIndex: number, patch: Partial<SetEntry>) {
    patchActive((a) => ({
      ...a,
      exercises: a.exercises.map((we, i) =>
        i !== exIndex ? we : { ...we, sets: we.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) },
      ),
    }));
  },

  removeSet(exIndex: number, setIndex: number) {
    patchActive((a) => ({
      ...a,
      exercises: a.exercises.map((we, i) =>
        i !== exIndex ? we : { ...we, sets: we.sets.filter((_, j) => j !== setIndex) },
      ),
    }));
  },

  discardWorkout() {
    set({ ...state, active: null });
  },

  /** Returns the saved session, or null if nothing valid was logged. */
  finishWorkout(): { session: Session; rewards: Reward[] } | null {
    const a = state.active;
    if (!a) return null;
    const map = exerciseMap(state.customExercises);
    const exercises = a.exercises
      .map((we) => ({ ...we, sets: we.sets.filter((s) => s.done) }))
      .filter((we) => we.sets.length > 0);
    if (!exercises.length) return null;
    const prs = findPrs(exercises, computeBests(state.sessions, map), map);
    const session: Session = {
      id: a.id, mode: a.mode, startedAt: a.startedAt, endedAt: Date.now(),
      exercises, prs, xp: sessionXp(exercises, prs, map),
    };
    const r = commit({ ...state, active: null, sessions: [...state.sessions, session] });
    return { session, rewards: r };
  },

  deleteSession(id: string) {
    // Badges already earned are kept — they're a permanent record.
    set({ ...state, sessions: state.sessions.filter((s) => s.id !== id) });
  },

  claimQuests(summary: Summary): number {
    const key = dateKey(Date.now());
    if (state.questClaims[key]) return 0;
    const quests = dailyQuests(key, summary.level.level, summary.today);
    if (!quests.every((q) => q.progress >= q.target)) return 0;
    const bonus = questBonus(summary.level.level);
    commit({ ...state, questClaims: { ...state.questClaims, [key]: bonus } });
    return bonus;
  },

  updateProfile(patch: Partial<Profile>) {
    commit({ ...state, profile: { ...state.profile, ...patch } });
  },

  addCustomExercise(ex: Omit<Exercise, 'id' | 'custom'>): string {
    const id = 'custom-' + uid();
    set({ ...state, customExercises: [...state.customExercises, { ...ex, id, custom: true }] });
    return id;
  },

  exportData(): string {
    return JSON.stringify(state, null, 2);
  },

  importData(json: string) {
    const parsed = JSON.parse(json) as AppState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.sessions)) throw new Error('Not a WorkoutBro backup');
    set({ ...fresh(), ...parsed, profile: { ...fresh().profile, ...parsed.profile } });
  },

  resetAll() {
    set(fresh());
  },
};


