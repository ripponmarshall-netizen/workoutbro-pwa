import { describe, expect, it } from 'vitest';
import { BADGES, newlyUnlocked } from './badges';
import { exerciseMap } from './exercises';
import {
  computeBests, dailyQuests, dateKey, dayNumber, findPrs, levelFromXp, rankForLevel, sessionXp, setXp,
  streaks, summarise, xpToNext,
} from './game';
import type { AppState, Session, WorkoutExercise } from './types';

const map = exerciseMap([]);
const DAY = 86_400_000;

function session(id: string, at: number, exercises: WorkoutExercise[], mode: Session['mode'] = 'gym'): Session {
  const prs = findPrs(exercises, new Map(), map);
  return { id, mode, startedAt: at, endedAt: at + 45 * 60_000, exercises, prs, xp: sessionXp(exercises, prs, map) };
}

function baseState(sessions: Session[]): AppState {
  return {
    version: 1,
    profile: { name: 'T', unit: 'kg', sound: false, weeklyGoal: 3, title: null },
    sessions, customExercises: [], active: null, badges: {}, questClaims: {},
  };
}

describe('levels and ranks', () => {
  it('starts at level 1 and levels up at xpToNext(1)', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(xpToNext(1) - 1).level).toBe(1);
    expect(levelFromXp(xpToNext(1)).level).toBe(2);
  });
  it('maps levels to ranks', () => {
    expect(rankForLevel(1).id).toBe('E');
    expect(rankForLevel(5).id).toBe('D');
    expect(rankForLevel(44).id).toBe('A');
    expect(rankForLevel(45).id).toBe('S');
  });
});

describe('set XP', () => {
  it('ignores sets not marked done or empty', () => {
    expect(setXp({ id: 'a', done: false, reps: 10, weight: 50 }, map.get('bench'))).toBe(0);
    expect(setXp({ id: 'a', done: true, reps: 0, weight: 50 }, map.get('bench'))).toBe(0);
  });
  it('scales with volume and caps', () => {
    const light = setXp({ id: 'a', done: true, reps: 10, weight: 20 }, map.get('bench'));
    const heavy = setXp({ id: 'a', done: true, reps: 5, weight: 100 }, map.get('bench'));
    const huge = setXp({ id: 'a', done: true, reps: 50, weight: 500 }, map.get('bench'));
    expect(heavy).toBeGreaterThan(light);
    expect(huge).toBe(50);
  });
  it('handles reps-only and timed exercises', () => {
    expect(setXp({ id: 'a', done: true, reps: 20 }, map.get('pushup'))).toBe(20);
    expect(setXp({ id: 'a', done: true, seconds: 60 }, map.get('plank'))).toBe(18);
  });
});

describe('personal records', () => {
  it('first attempt is a baseline, beating it is a PR', () => {
    const t0 = new Date(2026, 0, 5, 10).getTime();
    const s1 = session('1', t0, [{ exerciseId: 'pushup', sets: [{ id: 'a', done: true, reps: 20 }] }]);
    expect(s1.prs).toHaveLength(0);
    const prior = computeBests([s1], map);
    const better = [{ exerciseId: 'pushup', sets: [{ id: 'b', done: true, reps: 25 }] }];
    expect(findPrs(better, prior, map)).toEqual([{ exerciseId: 'pushup', kind: 'reps', value: 25 }]);
    const same = [{ exerciseId: 'pushup', sets: [{ id: 'c', done: true, reps: 20 }] }];
    expect(findPrs(same, prior, map)).toHaveLength(0);
  });
});

describe('streaks (one rest day allowed)', () => {
  it('counts training days with gaps of at most one rest day', () => {
    expect(streaks([10, 11, 13, 15], 15)).toEqual({ current: 4, longest: 4 });
    expect(streaks([10, 11, 14, 15], 15)).toEqual({ current: 2, longest: 2 });
  });
  it('stays alive through one rest day, breaks after two', () => {
    expect(streaks([10, 11], 13).current).toBe(2);
    expect(streaks([10, 11], 14).current).toBe(0);
  });
});

describe('daily quests', () => {
  it('are deterministic per day and always include clearing a gate', () => {
    const today = { sets: 0, reps: 0, volume: 0, seconds: 0, minutes: 0, pushups: 0, gates: 0 };
    const a = dailyQuests('2026-11-06', 3, today);
    const b = dailyQuests('2026-11-06', 3, today);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    expect(a[0].kind).toBe('gate');
  });
});

describe('summary and badges', () => {
  it('unlocks Awakening and Night Shift from a late workout', () => {
    const late = new Date(2026, 10, 5, 23, 0).getTime();
    const s = session('1', late, [{ exerciseId: 'bench', sets: [{ id: 'a', done: true, reps: 5, weight: 60 }] }]);
    const sum = summarise(baseState([s]), map, late + 30 * 60_000);
    const ids = newlyUnlocked(sum, {}).map((b) => b.id);
    expect(ids).toContain('awakening');
    expect(ids).toContain('night-shift');
    expect(ids).not.toContain('gates-10');
    expect(sum.volume).toBe(300);
    expect(sum.today.gates).toBe(1);
  });
  it('does not re-unlock badges already held', () => {
    const sum = summarise(baseState([session('1', Date.now(), [{ exerciseId: 'pushup', sets: [{ id: 'a', done: true, reps: 10 }] }], 'bodyweight')]), map);
    expect(newlyUnlocked(sum, { awakening: 1 }).map((b) => b.id)).not.toContain('awakening');
  });
  it('badge ids are unique', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
  it('dateKey and dayNumber agree on local days', () => {
    const t = new Date(2026, 10, 6, 0, 30).getTime();
    expect(dateKey(t)).toBe('2026-11-06');
    expect(dayNumber(t + 23 * 3600_000)).toBe(dayNumber(t));
  });
});
