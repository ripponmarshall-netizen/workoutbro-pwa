import { createId } from '../lib/id';
import { nowIso } from '../lib/time';
import type {
  PersonalRecord,
  PreviousPerformanceSnapshot,
  SetEntry,
  UUID,
  WeightUnit,
} from '../types/domain';

export function getEstimatedOneRepMax(weightValue: number | null, reps: number | null): number | null {
  if (!weightValue || !reps || reps <= 0) return null;
  if (reps > 12) return null;
  return Number((weightValue * (1 + reps / 30)).toFixed(2));
}

function normalizeWeight(weightValue: number | null, weightUnit: WeightUnit | null): number {
  if (!weightValue || !weightUnit) return 0;
  return weightUnit === 'kg' ? weightValue : weightValue * 0.45359237;
}

export function getPreviousPerformanceSnapshot(exerciseLocalId: UUID, historicalSets: SetEntry[]): PreviousPerformanceSnapshot {
  const validSets = historicalSets.filter((set) => set.isCompleted && !set.isDeletedLogical).sort((a, b) => {
    return new Date(b.completedAt ?? b.updatedAt).getTime() - new Date(a.completedAt ?? a.updatedAt).getTime();
  });

  const latest = validSets[0];
  return {
    exerciseLocalId,
    lastPerformedAt: latest?.completedAt ?? null,
    lastWeightValue: latest?.weightValue ?? null,
    lastWeightUnit: latest?.weightUnit ?? null,
    lastReps: latest?.reps ?? null,
    lastSetCount: validSets.length,
    recentBestLoad: validSets.reduce<number | null>((best, set) => {
      const w = set.weightValue ?? null;
      if (w == null) return best;
      return best == null ? w : Math.max(best, w);
    }, null),
    recentBestReps: validSets.reduce<number | null>((best, set) => {
      const reps = set.reps ?? null;
      if (reps == null) return best;
      return best == null ? reps : Math.max(best, reps);
    }, null),
    recentEstimated1RM: validSets.reduce<number | null>((best, set) => {
      const orm = getEstimatedOneRepMax(set.weightValue, set.reps);
      if (orm == null) return best;
      return best == null ? orm : Math.max(best, orm);
    }, null),
  };
}

export function detectExercisePRs(params: {
  userLocalId: UUID;
  exerciseLocalId: UUID;
  currentSets: SetEntry[];
  existingPrs: PersonalRecord[];
  deviceId: string;
  at?: string;
}): PersonalRecord[] {
  const ts = params.at ?? nowIso();
  const validSets = params.currentSets.filter((set) => set.isCompleted && !set.isDeletedLogical && set.setType !== 'warmup');
  const prs: PersonalRecord[] = [];

  const bestLoadSet = validSets.reduce<SetEntry | null>((best, set) => {
    if (!set.weightValue) return best;
    if (!best) return set;
    return normalizeWeight(set.weightValue, set.weightUnit) > normalizeWeight(best.weightValue, best.weightUnit) ? set : best;
  }, null);

  const bestRepsSet = validSets.reduce<SetEntry | null>((best, set) => {
    if (!set.reps) return best;
    if (!best) return set;
    return (set.reps ?? 0) > (best.reps ?? 0) ? set : best;
  }, null);

  const bestVolumeSet = validSets.reduce<SetEntry | null>((best, set) => {
    const volume = normalizeWeight(set.weightValue, set.weightUnit) * (set.reps ?? 0);
    const bestVolume = best ? normalizeWeight(best.weightValue, best.weightUnit) * (best.reps ?? 0) : 0;
    return volume > bestVolume ? set : best;
  }, null);

  const bestOrmSet = validSets.reduce<SetEntry | null>((best, set) => {
    const orm = getEstimatedOneRepMax(set.weightValue, set.reps) ?? 0;
    const bestOrm = best ? getEstimatedOneRepMax(best.weightValue, best.reps) ?? 0 : 0;
    return orm > bestOrm ? set : best;
  }, null);

  const existingMap = new Map(params.existingPrs.map((pr) => [pr.prType, pr]));

  const maybeCreate = (
    prType: PersonalRecord['prType'],
    valueNumeric: number | null,
    valueUnit: PersonalRecord['valueUnit'],
    sourceSet: SetEntry | null,
  ) => {
    if (!sourceSet || valueNumeric == null) return;
    const current = existingMap.get(prType);
    if (current && current.valueNumeric >= valueNumeric) return;

    prs.push({
      localId: current?.localId ?? createId(),
      serverId: current?.serverId ?? null,
      deviceId: params.deviceId,
      syncStatus: 'pending',
      revision: (current?.revision ?? 0) + 1,
      serverRevision: current?.serverRevision ?? null,
      lastSyncedAt: current?.lastSyncedAt ?? null,
      createdAt: current?.createdAt ?? ts,
      updatedAt: ts,
      deletedAt: null,
      userLocalId: params.userLocalId,
      exerciseLocalId: params.exerciseLocalId,
      prType,
      valueNumeric,
      valueUnit,
      sourceSetLocalId: sourceSet.localId,
      sourceWorkoutSessionLocalId: sourceSet.workoutSessionLocalId,
      achievedAt: sourceSet.completedAt ?? ts,
      verifiedByServer: false,
    });
  };

  maybeCreate('max_load', bestLoadSet ? Number(normalizeWeight(bestLoadSet.weightValue, bestLoadSet.weightUnit).toFixed(2)) : null, 'kg', bestLoadSet);
  maybeCreate('max_reps', bestRepsSet?.reps ?? null, 'reps', bestRepsSet);
  maybeCreate('max_volume_set', bestVolumeSet ? Number((normalizeWeight(bestVolumeSet.weightValue, bestVolumeSet.weightUnit) * (bestVolumeSet.reps ?? 0)).toFixed(2)) : null, 'volume', bestVolumeSet);
  maybeCreate('estimated_1rm', bestOrmSet ? getEstimatedOneRepMax(bestOrmSet.weightValue, bestOrmSet.reps) : null, 'kg', bestOrmSet);

  return prs;
}
