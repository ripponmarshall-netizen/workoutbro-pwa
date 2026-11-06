import type { AppState, Exercise, Mode, PrHit, Session, SetEntry, TrainStat, WorkoutExercise } from './types';

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Local calendar day as an integer (days since epoch, local time). */
export function dayNumber(ts: number): number {
  const d = new Date(ts);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function dateKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Monday-based week number from a day number (day 0 = Thu 1 Jan 1970). */
export function weekNumber(day: number): number {
  return Math.floor((day + 3) / 7);
}

/* ------------------------------------------------------------------ */
/* XP, levels, ranks                                                   */
/* ------------------------------------------------------------------ */

export function xpToNext(level: number): number {
  return Math.round(100 * Math.pow(level, 1.2));
}

export interface LevelInfo {
  level: number;
  into: number;
  need: number;
  total: number;
}

export function levelFromXp(total: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(total));
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  return { level, into: remaining, need: xpToNext(level), total };
}

export type RankId = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export const RANKS: { id: RankId; minLevel: number; title: string }[] = [
  { id: 'E', minLevel: 1, title: 'E-Rank Hunter' },
  { id: 'D', minLevel: 5, title: 'D-Rank Hunter' },
  { id: 'C', minLevel: 12, title: 'C-Rank Hunter' },
  { id: 'B', minLevel: 20, title: 'B-Rank Hunter' },
  { id: 'A', minLevel: 30, title: 'A-Rank Hunter' },
  { id: 'S', minLevel: 45, title: 'S-Rank Hunter' },
];

export function rankForLevel(level: number) {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.minLevel) r = rank;
  return r;
}

export function nextRank(level: number) {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}

/* ------------------------------------------------------------------ */
/* Sets & sessions                                                     */
/* ------------------------------------------------------------------ */

export function isSetValid(set: SetEntry, ex: Exercise | undefined): boolean {
  if (!set.done || !ex) return false;
  if (ex.track === 'time') return (set.seconds ?? 0) > 0;
  return (set.reps ?? 0) > 0;
}

export function setXp(set: SetEntry, ex: Exercise | undefined): number {
  if (!ex || !isSetValid(set, ex)) return 0;
  if (ex.track === 'weight') {
    const vol = (set.weight ?? 0) * (set.reps ?? 0);
    return Math.round(10 + Math.min(40, vol / 20));
  }
  if (ex.track === 'reps') return Math.round(8 + Math.min(30, (set.reps ?? 0) * 0.6));
  return Math.round(8 + Math.min(30, (set.seconds ?? 0) / 6));
}

export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export type Bests = Map<string, { e1rm: number; reps: number; time: number }>;

export function computeBests(sessions: Session[], exMap: Map<string, Exercise>): Bests {
  const bests: Bests = new Map();
  for (const s of sessions) mergeBests(bests, s.exercises, exMap);
  return bests;
}

function mergeBests(bests: Bests, exercises: WorkoutExercise[], exMap: Map<string, Exercise>) {
  for (const we of exercises) {
    const ex = exMap.get(we.exerciseId);
    const b = bests.get(we.exerciseId) ?? { e1rm: 0, reps: 0, time: 0 };
    for (const set of we.sets) {
      if (!isSetValid(set, ex)) continue;
      if (ex!.track === 'weight') b.e1rm = Math.max(b.e1rm, e1rm(set.weight ?? 0, set.reps ?? 0));
      if (ex!.track === 'reps') b.reps = Math.max(b.reps, set.reps ?? 0);
      if (ex!.track === 'time') b.time = Math.max(b.time, set.seconds ?? 0);
    }
    bests.set(we.exerciseId, b);
  }
}

/** PRs only count when beating an existing record (first attempt sets a baseline). */
export function findPrs(exercises: WorkoutExercise[], prior: Bests, exMap: Map<string, Exercise>): PrHit[] {
  const now: Bests = new Map();
  mergeBests(now, exercises, exMap);
  const hits: PrHit[] = [];
  for (const [id, b] of now) {
    const p = prior.get(id);
    if (!p) continue;
    if (p.e1rm > 0 && b.e1rm > p.e1rm + 0.01) hits.push({ exerciseId: id, kind: 'e1rm', value: b.e1rm });
    if (p.reps > 0 && b.reps > p.reps) hits.push({ exerciseId: id, kind: 'reps', value: b.reps });
    if (p.time > 0 && b.time > p.time) hits.push({ exerciseId: id, kind: 'time', value: b.time });
  }
  return hits;
}

export const COMPLETION_XP = 25;
export const PR_XP = 30;

export function sessionXp(exercises: WorkoutExercise[], prs: PrHit[], exMap: Map<string, Exercise>): number {
  let xp = 0;
  for (const we of exercises) for (const s of we.sets) xp += setXp(s, exMap.get(we.exerciseId));
  return xp + COMPLETION_XP + prs.length * PR_XP;
}

export interface SessionTotals {
  sets: number;
  reps: number;
  volume: number;
  seconds: number;
  minutes: number;
  pushups: number;
}

export function sessionTotals(s: Pick<Session, 'exercises' | 'startedAt' | 'endedAt'>, exMap: Map<string, Exercise>): SessionTotals {
  const t: SessionTotals = { sets: 0, reps: 0, volume: 0, seconds: 0, minutes: 0, pushups: 0 };
  for (const we of s.exercises) {
    const ex = exMap.get(we.exerciseId);
    for (const set of we.sets) {
      if (!isSetValid(set, ex)) continue;
      t.sets++;
      if (ex!.track === 'time') t.seconds += set.seconds ?? 0;
      else {
        t.reps += set.reps ?? 0;
        if (ex!.track === 'weight') t.volume += (set.weight ?? 0) * (set.reps ?? 0);
        if (ex!.id.includes('pushup')) t.pushups += set.reps ?? 0;
      }
    }
  }
  t.minutes = Math.max(0, Math.round((s.endedAt - s.startedAt) / 60_000));
  return t;
}

/* ------------------------------------------------------------------ */
/* Streaks — one rest day allowed between training days (shift-friendly) */
/* ------------------------------------------------------------------ */

export const STREAK_MAX_GAP = 2; // train Mon, rest Tue, train Wed = still alive

export function trainingDays(sessions: Session[]): number[] {
  return [...new Set(sessions.map((s) => dayNumber(s.startedAt)))].sort((a, b) => a - b);
}

export function streaks(days: number[], today: number): { current: number; longest: number } {
  if (!days.length) return { current: 0, longest: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] <= STREAK_MAX_GAP ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const alive = today - days[days.length - 1] <= STREAK_MAX_GAP;
  return { current: alive ? run : 0, longest };
}

/* ------------------------------------------------------------------ */
/* Daily quests                                                        */
/* ------------------------------------------------------------------ */

export type QuestKind = 'gate' | 'reps' | 'sets' | 'minutes' | 'pushups';

export interface Quest {
  kind: QuestKind;
  label: string;
  target: number;
  progress: number;
  unit: string;
}

function seeded(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function questBonus(level: number): number {
  return 50 + level * 5;
}

export function dailyQuests(key: string, level: number, today: SessionTotals & { gates: number }): Quest[] {
  const pool: Omit<Quest, 'progress'>[] = [
    { kind: 'reps', label: 'Rep Grinder', target: Math.min(200, 40 + level * 4), unit: 'reps' },
    { kind: 'sets', label: 'Iron Offering', target: Math.min(25, 8 + Math.floor(level / 2)), unit: 'sets' },
    { kind: 'minutes', label: 'Time in the Gate', target: Math.min(60, 15 + level), unit: 'min' },
    { kind: 'pushups', label: 'Push-up Trial', target: Math.min(100, 20 + level * 2), unit: 'push-ups' },
  ];
  const rand = seeded(key);
  const picks = [...pool].sort(() => rand() - 0.5).slice(0, 2);
  const quests: Omit<Quest, 'progress'>[] = [{ kind: 'gate', label: 'Clear a Gate', target: 1, unit: 'workout' }, ...picks];
  const value: Record<QuestKind, number> = {
    gate: today.gates, reps: today.reps, sets: today.sets, minutes: today.minutes, pushups: today.pushups,
  };
  return quests.map((q) => ({ ...q, progress: Math.min(q.target, value[q.kind]) }));
}

/* ------------------------------------------------------------------ */
/* Player summary — everything badges, stats and UI need               */
/* ------------------------------------------------------------------ */

export interface Summary {
  totalXp: number;
  level: LevelInfo;
  rank: (typeof RANKS)[number];
  sessions: number;
  byMode: Record<Mode, number>;
  volume: number;
  reps: number;
  seconds: number;
  pushups: number;
  squats: number;
  prs: number;
  streak: number;
  longestStreak: number;
  questDays: number;
  nightOwl: number;
  earlyBird: number;
  longestMinutes: number;
  maxSets: number;
  distinctExercises: number;
  weeksGoalHit: number;
  thisWeekDays: number;
  stats: Record<TrainStat | 'vit' | 'wil', number>;
  today: SessionTotals & { gates: number };
  /** Level at the start of today — quest targets use this so they don't move mid-day. */
  questLevel: number;
}

export function summarise(state: AppState, exMap: Map<string, Exercise>, now = Date.now()): Summary {
  const byMode: Record<Mode, number> = { gym: 0, home: 0, bodyweight: 0 };
  const statXp: Record<TrainStat, number> = { str: 0, agi: 0, end: 0 };
  const exSeen = new Set<string>();
  const todayNum = dayNumber(now);
  const today: Summary['today'] = { sets: 0, reps: 0, volume: 0, seconds: 0, minutes: 0, pushups: 0, gates: 0 };
  let volume = 0, reps = 0, seconds = 0, pushups = 0, squats = 0, prs = 0;
  let nightOwl = 0, earlyBird = 0, longestMinutes = 0, maxSets = 0, sessionXpTotal = 0, todayXp = 0;
  const weekDays = new Map<number, Set<number>>();

  for (const s of state.sessions) {
    byMode[s.mode]++;
    sessionXpTotal += s.xp;
    prs += s.prs.length;
    const t = sessionTotals(s, exMap);
    volume += t.volume; reps += t.reps; seconds += t.seconds; pushups += t.pushups;
    longestMinutes = Math.max(longestMinutes, t.minutes);
    maxSets = Math.max(maxSets, t.sets);
    const hour = new Date(s.startedAt).getHours();
    if (hour >= 22 || hour < 4) nightOwl++;
    if (hour >= 4 && hour < 6) earlyBird++;
    const day = dayNumber(s.startedAt);
    const wk = weekNumber(day);
    if (!weekDays.has(wk)) weekDays.set(wk, new Set());
    weekDays.get(wk)!.add(day);
    if (day === todayNum) {
      todayXp += s.xp;
      today.gates++; today.sets += t.sets; today.reps += t.reps; today.volume += t.volume;
      today.seconds += t.seconds; today.minutes += t.minutes; today.pushups += t.pushups;
    }
    for (const we of s.exercises) {
      const ex = exMap.get(we.exerciseId);
      if (!ex) continue;
      let any = false;
      for (const set of we.sets) {
        const xp = setXp(set, ex);
        if (xp > 0) { any = true; statXp[ex.stat] += xp; }
        if (xp > 0 && /squat/.test(ex.id) && ex.track !== 'time') squats += set.reps ?? 0;
      }
      if (any) exSeen.add(ex.id);
    }
  }

  const questXp = Object.values(state.questClaims).reduce((a, b) => a + b, 0);
  const totalXp = sessionXpTotal + questXp;
  const level = levelFromXp(totalXp);
  const questLevel = levelFromXp(totalXp - todayXp - (state.questClaims[dateKey(now)] ?? 0)).level;
  const st = streaks(trainingDays(state.sessions), todayNum);
  const questDays = Object.keys(state.questClaims).length;
  const goal = Math.max(1, state.profile.weeklyGoal);
  const weeksGoalHit = [...weekDays.values()].filter((d) => d.size >= goal).length;
  const stat = (xp: number) => 10 + Math.floor(Math.sqrt(xp / 4));

  return {
    totalXp, level, rank: rankForLevel(level.level),
    sessions: state.sessions.length, byMode, volume, reps, seconds, pushups, squats, prs,
    streak: st.current, longestStreak: st.longest, questDays, nightOwl, earlyBird,
    longestMinutes, maxSets, distinctExercises: exSeen.size, weeksGoalHit,
    thisWeekDays: weekDays.get(weekNumber(todayNum))?.size ?? 0,
    stats: {
      str: stat(statXp.str), agi: stat(statXp.agi), end: stat(statXp.end),
      vit: 10 + Math.floor(Math.sqrt(state.sessions.length * 20)),
      wil: 10 + st.longest + questDays,
    },
    today,
    questLevel,
  };
}
