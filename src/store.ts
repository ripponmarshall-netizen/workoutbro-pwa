import { useSyncExternalStore } from 'react';
import { newlyUnlocked, type Badge } from './engine/badges';
import { exerciseMap } from './engine/exercises';
import {
  computeBests, dailyQuests, dateKey, findPrs, questBonus, sessionXp, summarise,
  type Summary,
} from './engine/game';
import type { ActiveWorkout, AppState, Exercise, Mode, Profile, Session, SetEntry, WorkoutExercise } from './engine/types';

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

/* ------------------------------------------------------------------ */
/* Tiny external stores                                                */
/* ------------------------------------------------------------------ */

function createSignal<T>(initial: T) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) { value = next; subs.forEach((l) => l()); },
    subscribe(l: () => void) { subs.add(l); return () => { subs.delete(l); }; },
  };
}

const app = createSignal<AppState>(load());
let saveWarned = false;

function set(next: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    saveWarned = false;
  } catch {
    if (!saveWarned) {
      saveWarned = true;
      toast('Could not save to this device (storage full or private mode). Export a backup now.', undefined, 8000);
    }
  }
  app.set(next);
}

export function useStore(): AppState {
  return useSyncExternalStore(app.subscribe, app.get);
}

export const getState = app.get;

/* ------------------------------------------------------------------ */
/* Toasts (system notices with optional Undo)                          */
/* ------------------------------------------------------------------ */

export interface Toast { id: string; text: string; action?: { label: string; run: () => void }; ttl: number }
const toasts = createSignal<Toast[]>([]);

export function toast(text: string, action?: Toast['action'], ttl = 4000) {
  const t: Toast = { id: uid(), text, action, ttl };
  toasts.set([...toasts.get().slice(-2), t]);
  setTimeout(() => dismissToast(t.id), ttl);
}

export function dismissToast(id: string) {
  toasts.set(toasts.get().filter((t) => t.id !== id));
}

export function useToasts() {
  return useSyncExternalStore(toasts.subscribe, toasts.get);
}

/* ------------------------------------------------------------------ */
/* Reward events (level-ups, badges, rank-ups) for the overlay          */
/* ------------------------------------------------------------------ */

export type Reward =
  | { kind: 'level'; level: number }
  | { kind: 'rank'; rank: string; title: string }
  | { kind: 'badge'; badge: Badge };

const rewards = createSignal<Reward[]>([]);

export function useRewards(): [Reward | undefined, () => void] {
  const queue = useSyncExternalStore(rewards.subscribe, rewards.get);
  return [queue[0], () => rewards.set(rewards.get().slice(1))];
}

/** Apply a state change, then detect level/rank-ups and new badges. */
function commit(next: AppState): Reward[] {
  const state = app.get();
  const before = summarise(state, exerciseMap(state.customExercises));
  const after = summarise(next, exerciseMap(next.customExercises));
  const out: Reward[] = [];
  if (after.level.level > before.level.level) {
    out.push({ kind: 'level', level: after.level.level });
    if (after.rank.id !== before.rank.id) out.push({ kind: 'rank', rank: after.rank.id, title: after.rank.title });
  }
  const unlocked = newlyUnlocked(after, next.badges);
  if (unlocked.length) {
    const now = Date.now();
    next = { ...next, badges: { ...next.badges, ...Object.fromEntries(unlocked.map((b) => [b.id, now])) } };
    unlocked.forEach((badge) => out.push({ kind: 'badge', badge }));
  }
  set(next);
  if (out.length) rewards.set([...rewards.get(), ...out]);
  return out;
}

/* ------------------------------------------------------------------ */
/* Active workout                                                      */
/* ------------------------------------------------------------------ */

function patchActive(fn: (a: ActiveWorkout) => ActiveWorkout) {
  const state = app.get();
  if (!state.active) return;
  set({ ...state, active: fn(state.active) });
}

function firstSet(exerciseId: string, state: AppState): WorkoutExercise | null {
  const ex = exerciseMap(state.customExercises).get(exerciseId);
  if (!ex) return null;
  // Pre-fill from the last time this exercise was done
  const last = [...state.sessions].reverse().find((s) => s.exercises.some((e) => e.exerciseId === exerciseId));
  const lastSet = last?.exercises.find((e) => e.exerciseId === exerciseId)?.sets.slice(-1)[0];
  const set: SetEntry = {
    id: uid(), done: false,
    weight: ex.track === 'weight' ? lastSet?.weight ?? 0 : undefined,
    reps: ex.track !== 'time' ? lastSet?.reps ?? 10 : undefined,
    seconds: ex.track === 'time' ? lastSet?.seconds ?? 30 : undefined,
  };
  return { exerciseId, sets: [set] };
}

export const actions = {
  startWorkout(mode: Mode, exerciseIds: string[] = []) {
    const state = app.get();
    if (state.active) return;
    const exercises = exerciseIds.map((id) => firstSet(id, state)).filter((x): x is WorkoutExercise => !!x);
    set({ ...state, active: { id: uid(), mode, startedAt: Date.now(), exercises } });
  },

  addExercise(exerciseId: string) {
    const we = firstSet(exerciseId, app.get());
    if (we) patchActive((a) => ({ ...a, exercises: [...a.exercises, we] }));
  },

  removeExercise(index: number) {
    const removed = app.get().active?.exercises[index];
    if (!removed) return;
    patchActive((a) => ({ ...a, exercises: a.exercises.filter((_, i) => i !== index) }));
    toast('Exercise removed', {
      label: 'Undo',
      run: () => patchActive((a) => {
        const exercises = [...a.exercises];
        exercises.splice(Math.min(index, exercises.length), 0, removed);
        return { ...a, exercises };
      }),
    });
  },

  moveExercise(index: number, dir: -1 | 1) {
    patchActive((a) => {
      const j = index + dir;
      if (j < 0 || j >= a.exercises.length) return a;
      const exercises = [...a.exercises];
      [exercises[index], exercises[j]] = [exercises[j], exercises[index]];
      return { ...a, exercises };
    });
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

  /** Apply values to every unticked set of an exercise (used by progression hints). */
  applyToOpenSets(exIndex: number, patch: Partial<SetEntry>) {
    patchActive((a) => ({
      ...a,
      exercises: a.exercises.map((we, i) =>
        i !== exIndex ? we : { ...we, sets: we.sets.map((s) => (s.done ? s : { ...s, ...patch })) },
      ),
    }));
  },

  removeSet(exIndex: number, setIndex: number) {
    const removed = app.get().active?.exercises[exIndex]?.sets[setIndex];
    if (!removed) return;
    patchActive((a) => ({
      ...a,
      exercises: a.exercises.map((we, i) =>
        i !== exIndex ? we : { ...we, sets: we.sets.filter((_, j) => j !== setIndex) },
      ),
    }));
    toast(`Set ${setIndex + 1} removed`, {
      label: 'Undo',
      run: () => patchActive((a) => ({
        ...a,
        exercises: a.exercises.map((we, i) => {
          if (i !== exIndex) return we;
          const sets = [...we.sets];
          sets.splice(Math.min(setIndex, sets.length), 0, removed);
          return { ...we, sets };
        }),
      })),
    });
  },

  setRest(endsAt: number | null) {
    patchActive((a) => ({ ...a, restEnd: endsAt ?? undefined }));
  },

  discardWorkout() {
    const state = app.get();
    set({ ...state, active: null });
  },

  /** Returns the saved session, or null if nothing valid was logged. */
  finishWorkout(): { session: Session; rewards: Reward[] } | null {
    const state = app.get();
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
    const state = app.get();
    const idx = state.sessions.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const removed = state.sessions[idx];
    set({ ...state, sessions: state.sessions.filter((s) => s.id !== id) });
    toast('Record deleted', {
      label: 'Undo',
      run: () => {
        const cur = app.get();
        const sessions = [...cur.sessions];
        sessions.splice(Math.min(idx, sessions.length), 0, removed);
        set({ ...cur, sessions });
      },
    }, 6000);
  },

  claimQuests(summary: Summary): number {
    const state = app.get();
    const key = dateKey(Date.now());
    if (state.questClaims[key]) return 0;
    const quests = dailyQuests(key, summary.questLevel, summary.today);
    if (!quests.every((q) => q.progress >= q.target)) return 0;
    const bonus = questBonus(summary.questLevel);
    commit({ ...state, questClaims: { ...state.questClaims, [key]: bonus } });
    return bonus;
  },

  updateProfile(patch: Partial<Profile>) {
    const state = app.get();
    commit({ ...state, profile: { ...state.profile, ...patch } });
  },

  addCustomExercise(ex: Omit<Exercise, 'id' | 'custom'>): string {
    const state = app.get();
    const id = 'custom-' + uid();
    set({ ...state, customExercises: [...state.customExercises, { ...ex, id, custom: true }] });
    return id;
  },

  exportData(): string {
    return JSON.stringify(app.get(), null, 2);
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
