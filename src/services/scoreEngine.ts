import { SCORE_VERSION } from '../lib/constants';
import { createId } from '../lib/id';
import { nowIso } from '../lib/time';
import type {
  Goal,
  RankSnapshot,
  RankTier,
  ScoreHistoryEntry,
  SetEntry,
  UUID,
  WorkoutScoreBreakdown,
  WorkoutSession,
  WorkoutSessionExercise,
  XpHistoryEntry,
  SessionSummaryCache,
} from '../types/domain';

function toKg(weight: number, unit: 'kg' | 'lb' | null): number {
  if (!weight || !unit) return 0;
  return unit === 'kg' ? weight : weight * 0.45359237;
}

export function getVolumeForSession(sets: SetEntry[]): number {
  return sets
    .filter((set) => set.isCompleted && !set.isDeletedLogical)
    .reduce((sum, set) => sum + toKg(set.weightValue ?? 0, set.weightUnit) * (set.reps ?? 0), 0);
}

export function recomputeSessionSummary(params: {
  session: WorkoutSession;
  sessionExercises: WorkoutSessionExercise[];
  sets: SetEntry[];
  prCount?: number;
  scorePreview?: number | null;
  xpPreview?: number | null;
  now?: string;
}): SessionSummaryCache {
  const now = params.now ?? nowIso();
  const durationMs = new Date(params.session.endedAt ?? now).getTime() - new Date(params.session.startedAt).getTime() - params.session.totalPausedMs;
  const totalSets = params.sets.filter((s) => !s.isDeletedLogical).length;
  const totalWorkingSets = params.sets.filter((s) => s.setType === 'working' && !s.isDeletedLogical).length;

  return {
    totalExercises: params.sessionExercises.length,
    totalCompletedExercises: params.sessionExercises.filter((row) => row.isCompleted).length,
    totalSets,
    totalWorkingSets,
    totalVolumeKg: getVolumeForSession(params.sets),
    durationMs: Math.max(0, durationMs),
    prCount: params.prCount ?? params.session.summaryCacheJson?.prCount ?? 0,
    scorePreview: params.scorePreview ?? null,
    xpPreview: params.xpPreview ?? null,
  };
}

export function calculateWorkoutScore(params: {
  session: WorkoutSession;
  sessionExercises: WorkoutSessionExercise[];
  sets: SetEntry[];
  goals?: Goal[];
  streakDays?: number;
  previousBestVolumeKg?: number;
}): WorkoutScoreBreakdown {
  const workingSets = params.sets.filter((s) => s.isCompleted && !s.isDeletedLogical && s.setType !== 'warmup');
  const volumeKg = getVolumeForSession(workingSets);
  const baseCompletion = workingSets.length > 0 ? 100 : 0;
  const volumeQuality = Math.min(150, Math.round(volumeKg / 40));
  const progression = params.previousBestVolumeKg && volumeKg > params.previousBestVolumeKg ? 30 : 0;
  const completedExercises = params.sessionExercises.filter((e) => e.isCompleted).length;
  const structure = Math.min(50, completedExercises * 10);
  const goalBonus = (params.goals ?? []).filter((g) => g.status === 'active').length * 5;
  const streakBonus = Math.min(35, (params.streakDays ?? 0) * 2);
  const penalties = workingSets.length === 0 ? 25 : 0;
  const totalScore = Math.max(0, baseCompletion + volumeQuality + progression + structure + goalBonus + streakBonus - penalties);

  return {
    baseCompletion,
    volumeQuality,
    progression,
    structure,
    goalBonus,
    streakBonus,
    penalties,
    totalScore,
    explanation: [
      `Base ${baseCompletion}`,
      `Volume ${volumeQuality}`,
      `Progression ${progression}`,
      `Structure ${structure}`,
      `Goals ${goalBonus}`,
      `Streak ${streakBonus}`,
      `Penalties -${penalties}`,
    ],
  };
}

export function calculateXpAward(params: {
  userLocalId: UUID;
  workoutSessionLocalId: UUID;
  score: WorkoutScoreBreakdown;
  prCount: number;
  streakDays?: number;
}): XpHistoryEntry[] {
  const ts = nowIso();
  const rows: XpHistoryEntry[] = [];

  rows.push({
    localId: createId(),
    serverId: null,
    deviceId: 'local-device',
    syncStatus: 'pending',
    revision: 1,
    serverRevision: null,
    lastSyncedAt: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
    userLocalId: params.userLocalId,
    workoutSessionLocalId: params.workoutSessionLocalId,
    eventType: 'session_completed',
    xpDelta: 50 + Math.floor(params.score.totalScore / 20),
    reasonCode: 'session_completion',
    metaJson: { score: params.score.totalScore },
  });

  if (params.prCount > 0) {
    rows.push({
      localId: createId(),
      serverId: null,
      deviceId: 'local-device',
      syncStatus: 'pending',
      revision: 1,
      serverRevision: null,
      lastSyncedAt: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
      userLocalId: params.userLocalId,
      workoutSessionLocalId: params.workoutSessionLocalId,
      eventType: 'pr_awarded',
      xpDelta: params.prCount * 15,
      reasonCode: 'pr_bonus',
      metaJson: { prCount: params.prCount },
    });
  }

  if ((params.streakDays ?? 0) > 1) {
    rows.push({
      localId: createId(),
      serverId: null,
      deviceId: 'local-device',
      syncStatus: 'pending',
      revision: 1,
      serverRevision: null,
      lastSyncedAt: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
      userLocalId: params.userLocalId,
      workoutSessionLocalId: params.workoutSessionLocalId,
      eventType: 'streak_bonus',
      xpDelta: Math.min(25, (params.streakDays ?? 0) * 2),
      reasonCode: 'streak_bonus',
      metaJson: { streakDays: params.streakDays ?? 0 },
    });
  }

  return rows;
}

export function calculateRankSnapshot(params: {
  userLocalId: UUID;
  totalXp: number;
  effectiveAt?: string;
}): RankSnapshot {
  const effectiveAt = params.effectiveAt ?? nowIso();
  const level = Math.floor(params.totalXp / 250) + 1;
  const rankTier = resolveRankTier(params.totalXp);

  return {
    localId: createId(),
    serverId: null,
    deviceId: 'local-device',
    syncStatus: 'pending',
    revision: 1,
    serverRevision: null,
    lastSyncedAt: null,
    createdAt: effectiveAt,
    updatedAt: effectiveAt,
    deletedAt: null,
    userLocalId: params.userLocalId,
    totalXp: params.totalXp,
    level,
    rankTier,
    effectiveAt,
  };
}

export function createScoreHistoryEntry(params: {
  userLocalId: UUID;
  workoutSessionLocalId: UUID;
  breakdown: WorkoutScoreBreakdown;
  createdAt?: string;
}): ScoreHistoryEntry {
  const ts = params.createdAt ?? nowIso();
  return {
    localId: createId(),
    serverId: null,
    deviceId: 'local-device',
    syncStatus: 'pending',
    revision: 1,
    serverRevision: null,
    lastSyncedAt: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
    userLocalId: params.userLocalId,
    workoutSessionLocalId: params.workoutSessionLocalId,
    breakdown: params.breakdown,
    scoreVersion: SCORE_VERSION,
  };
}

function resolveRankTier(totalXp: number): RankTier {
  if (totalXp >= 10000) return 'elite';
  if (totalXp >= 8000) return 'diamond';
  if (totalXp >= 6500) return 'platinum_2';
  if (totalXp >= 5000) return 'platinum_1';
  if (totalXp >= 3500) return 'gold_3';
  if (totalXp >= 2500) return 'gold_2';
  if (totalXp >= 1800) return 'gold_1';
  if (totalXp >= 1200) return 'silver_3';
  if (totalXp >= 800) return 'silver_2';
  if (totalXp >= 500) return 'silver_1';
  if (totalXp >= 250) return 'bronze_3';
  if (totalXp >= 100) return 'bronze_2';
  return 'bronze_1';
}
