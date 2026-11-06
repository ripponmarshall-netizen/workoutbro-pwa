import type { RankId, Summary } from './game';

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: RankId;
  group: 'Gates' | 'Streaks' | 'Power' | 'Endurance' | 'Paths' | 'Records' | 'Rank' | 'Quests' | 'Secret';
  metric: (s: Summary) => number;
  target: number;
  unit?: string;
}

const b = (
  id: string, name: string, desc: string, icon: string, tier: RankId, group: Badge['group'],
  metric: Badge['metric'], target: number, unit?: string,
): Badge => ({ id, name, desc, icon, tier, group, metric, target, unit });

const sessions = (s: Summary) => s.sessions;
const level = (s: Summary) => s.level.level;

export const BADGES: Badge[] = [
  // Gates cleared
  b('awakening', 'Awakening', 'Clear your first Gate', '✨', 'E', 'Gates', sessions, 1, 'gates'),
  b('gates-10', 'Gate Regular', 'Clear 10 Gates', '🚪', 'D', 'Gates', sessions, 10, 'gates'),
  b('gates-50', 'Veteran Hunter', 'Clear 50 Gates', '⚔️', 'C', 'Gates', sessions, 50, 'gates'),
  b('gates-100', 'Centurion', 'Clear 100 Gates', '🛡️', 'B', 'Gates', sessions, 100, 'gates'),
  b('gates-250', 'Relentless', 'Clear 250 Gates', '🔱', 'A', 'Gates', sessions, 250, 'gates'),
  b('gates-500', 'Unending', 'Clear 500 Gates', '👑', 'S', 'Gates', sessions, 500, 'gates'),

  // Streaks (one rest day allowed)
  b('streak-3', 'Momentum', 'Reach a 3-day training streak', '🔥', 'E', 'Streaks', (s) => s.longestStreak, 3, 'days'),
  b('streak-7', 'Unbroken', 'Reach a 7-day training streak', '⛓️', 'D', 'Streaks', (s) => s.longestStreak, 7, 'days'),
  b('streak-14', 'Steel Resolve', 'Reach a 14-day training streak', '🗡️', 'C', 'Streaks', (s) => s.longestStreak, 14, 'days'),
  b('streak-30', 'Iron Will', 'Reach a 30-day training streak', '💠', 'A', 'Streaks', (s) => s.longestStreak, 30, 'days'),
  b('weeks-4', 'Raid Leader', 'Hit your weekly goal in 4 weeks', '📅', 'C', 'Streaks', (s) => s.weeksGoalHit, 4, 'weeks'),
  b('weeks-12', 'Season Conqueror', 'Hit your weekly goal in 12 weeks', '🏆', 'B', 'Streaks', (s) => s.weeksGoalHit, 12, 'weeks'),

  // Power — load moved
  b('vol-10k', 'Ten Tonne', 'Move 10,000 kg total', '🪨', 'D', 'Power', (s) => s.volume, 10_000, 'kg'),
  b('vol-100k', 'Mountain Mover', 'Move 100,000 kg total', '⛰️', 'B', 'Power', (s) => s.volume, 100_000, 'kg'),
  b('vol-1m', 'Titan', 'Move 1,000,000 kg total', '🌋', 'S', 'Power', (s) => s.volume, 1_000_000, 'kg'),

  // Endurance — reps and time
  b('reps-1k', 'Thousand Strikes', 'Log 1,000 total reps', '👊', 'D', 'Endurance', (s) => s.reps, 1_000, 'reps'),
  b('reps-10k', 'Ten Thousand Strikes', 'Log 10,000 total reps', '💥', 'B', 'Endurance', (s) => s.reps, 10_000, 'reps'),
  b('pushups-1k', 'Push Through', 'Do 1,000 push-ups', '💪', 'C', 'Endurance', (s) => s.pushups, 1_000, 'push-ups'),
  b('squats-1k', 'Unshakeable Legs', 'Do 1,000 squat reps', '🦵', 'C', 'Endurance', (s) => s.squats, 1_000, 'reps'),
  b('time-1h', 'Time Bender', 'Accumulate 60 min of timed work', '⏳', 'D', 'Endurance', (s) => Math.floor(s.seconds / 60), 60, 'min'),
  b('long-90', 'Marathon Raid', 'Spend 90+ minutes in one Gate', '🕰️', 'C', 'Endurance', (s) => s.longestMinutes, 90, 'min'),
  b('sets-20', 'Dungeon Crawler', 'Complete 20 sets in one Gate', '🗝️', 'C', 'Endurance', (s) => s.maxSets, 20, 'sets'),

  // Paths — training modes
  b('gym-10', 'Iron Temple', 'Clear 10 Gym Gates', '🏋️', 'D', 'Paths', (s) => s.byMode.gym, 10, 'gates'),
  b('home-10', 'Home Base', 'Clear 10 Home Gates', '🏠', 'D', 'Paths', (s) => s.byMode.home, 10, 'gates'),
  b('bw-10', 'Weightless', 'Clear 10 Bodyweight Gates', '🤸', 'D', 'Paths', (s) => s.byMode.bodyweight, 10, 'gates'),
  b('versatile', 'Versatile Hunter', 'Clear a Gate of every type', '🧭', 'C', 'Paths',
    (s) => [s.byMode.gym, s.byMode.home, s.byMode.bodyweight].filter((n) => n > 0).length, 3, 'types'),
  b('arsenal', 'Arsenal', 'Train 20 different exercises', '🧰', 'C', 'Paths', (s) => s.distinctExercises, 20, 'exercises'),

  // Records
  b('pr-1', 'Limit Break', 'Set your first personal record', '⚡', 'E', 'Records', (s) => s.prs, 1, 'PRs'),
  b('pr-10', 'Record Breaker', 'Set 10 personal records', '📈', 'C', 'Records', (s) => s.prs, 10, 'PRs'),
  b('pr-50', 'Beyond Limits', 'Set 50 personal records', '🌠', 'A', 'Records', (s) => s.prs, 50, 'PRs'),

  // Rank-ups
  b('rank-d', 'D-Rank Hunter', 'Reach level 5', '🟩', 'D', 'Rank', level, 5, 'lvl'),
  b('rank-c', 'C-Rank Hunter', 'Reach level 12', '🟦', 'C', 'Rank', level, 12, 'lvl'),
  b('rank-b', 'B-Rank Hunter', 'Reach level 20', '🟪', 'B', 'Rank', level, 20, 'lvl'),
  b('rank-a', 'A-Rank Hunter', 'Reach level 30', '🟧', 'A', 'Rank', level, 30, 'lvl'),
  b('rank-s', 'S-Rank Hunter', 'Reach level 45', '🟥', 'S', 'Rank', level, 45, 'lvl'),

  // Daily quests
  b('quest-1', 'Quest Accepted', 'Complete all daily quests once', '📜', 'E', 'Quests', (s) => s.questDays, 1, 'days'),
  b('quest-7', 'Dutiful', 'Complete daily quests on 7 days', '🎖️', 'C', 'Quests', (s) => s.questDays, 7, 'days'),
  b('quest-30', 'Quest Master', 'Complete daily quests on 30 days', '🏅', 'A', 'Quests', (s) => s.questDays, 30, 'days'),

  // Secret-ish
  b('night-shift', 'Night Shift', 'Start a Gate between 10pm and 4am', '🌙', 'D', 'Secret', (s) => s.nightOwl, 1),
  b('dawn-patrol', 'Dawn Patrol', 'Start a Gate between 4am and 6am', '🌅', 'D', 'Secret', (s) => s.earlyBird, 1),
];

export const TIER_COLOR: Record<RankId, string> = {
  E: '#8b95a7',
  D: '#4ade80',
  C: '#38bdf8',
  B: '#a78bfa',
  A: '#fb923c',
  S: '#f43f5e',
};

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((x) => x.id === id);
}

/** Badges whose metric now meets target but aren't yet recorded. */
export function newlyUnlocked(summary: Summary, have: Record<string, number>): Badge[] {
  return BADGES.filter((x) => !have[x.id] && x.metric(summary) >= x.target);
}
