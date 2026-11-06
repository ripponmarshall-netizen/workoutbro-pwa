import { describe, expect, it } from 'vitest';
import { EXERCISES, exerciseMap } from './exercises';
import { findPrs, levelFromXp, sessionXp, summarise, xpToNext } from './game';
import { muscleRest, progression, recommendPlan } from './recommend';
import type { AppState, Session, WorkoutExercise } from './types';

const map = exerciseMap([]);
const HOUR = 3_600_000;

function session(at: number, exercises: WorkoutExercise[], mode: Session['mode'] = 'gym', xp?: number): Session {
  const prs = findPrs(exercises, new Map(), map);
  return { id: String(at), mode, startedAt: at, endedAt: at + 30 * 60_000, exercises, prs, xp: xp ?? sessionXp(exercises, prs, map) };
}
const set = (o: object) => ({ id: Math.random().toString(), done: true, ...o });

describe('muscleRest', () => {
  it('reports hours since each muscle was trained and Infinity for never', () => {
    const now = Date.now();
    const s = session(now - 30 * HOUR, [{ exerciseId: 'bench', sets: [set({ weight: 60, reps: 8 })] }]);
    const r = muscleRest([s], map, now);
    expect(Math.round(r.chest)).toBe(30);
    expect(r.legs).toBe(Infinity);
  });
});

describe('recommendPlan', () => {
  it('avoids the muscle trained yesterday and only uses exercises for that gate', () => {
    const now = Date.now();
    const s = session(now - 20 * HOUR, [{ exerciseId: 'bench', sets: [set({ weight: 60, reps: 8 })] }]);
    const plan = recommendPlan('bodyweight', [s], EXERCISES, map, now);
    expect(plan.focus).not.toContain('chest');
    expect(plan.exerciseIds.length).toBeGreaterThanOrEqual(4);
    for (const id of plan.exerciseIds) expect(map.get(id)!.modes).toContain('bodyweight');
    expect(new Set(plan.exerciseIds).size).toBe(plan.exerciseIds.length);
  });
});

describe('progression', () => {
  it('adds load after hitting 8+ reps, otherwise adds a rep', () => {
    const t = Date.now();
    const heavy = session(t, [{ exerciseId: 'bench', sets: [set({ weight: 60, reps: 8 }), set({ weight: 60, reps: 7 })] }]);
    expect(progression('bench', [heavy], map)!.next).toEqual({ weight: 62.5, reps: 6 });
    const light = session(t, [{ exerciseId: 'bench', sets: [set({ weight: 60, reps: 6 })] }]);
    expect(progression('bench', [light], map)!.next).toEqual({ weight: 60, reps: 7 });
  });
  it('handles reps-only and timed exercises, and unseen exercises', () => {
    const t = Date.now();
    const s = session(t, [
      { exerciseId: 'pushup', sets: [set({ reps: 22 })] },
      { exerciseId: 'plank', sets: [set({ seconds: 45 })] },
    ], 'bodyweight');
    expect(progression('pushup', [s], map)!.next).toEqual({ reps: 24 });
    expect(progression('plank', [s], map)!.next).toEqual({ seconds: 50 });
    expect(progression('squat', [s], map)).toBeNull();
  });
});

describe('quest level is frozen for the day', () => {
  it('ignores XP earned today', () => {
    const now = new Date(2026, 10, 6, 15).getTime();
    const yesterday = session(now - 24 * HOUR, [{ exerciseId: 'pushup', sets: [set({ reps: 10 })] }], 'bodyweight', 50);
    const today = session(now - HOUR, [{ exerciseId: 'pushup', sets: [set({ reps: 10 })] }], 'bodyweight', xpToNext(1) * 3);
    const state: AppState = {
      version: 1, profile: { name: '', unit: 'kg', sound: false, weeklyGoal: 3, title: null },
      sessions: [yesterday, today], customExercises: [], active: null, badges: {}, questClaims: {},
    };
    const sum = summarise(state, map, now);
    expect(sum.level.level).toBeGreaterThan(1);
    expect(sum.questLevel).toBe(levelFromXp(50).level);
  });
});
