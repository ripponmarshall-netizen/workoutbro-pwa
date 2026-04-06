import { getDb } from '../db/database';
import { createId } from '../lib/id';
import { nowIso } from '../lib/time';
import type { Exercise, ExerciseCategory, EquipmentType, Goal, MuscleGroup, PersonalRecord, ScoreHistoryEntry, SetEntry, TemplateExercise, User, UserPreferences, WorkoutSession, WorkoutSessionExercise, WorkoutTemplate, XpHistoryEntry } from '../types/domain';

function syncMeta(overrides: Record<string, unknown> = {}) {
  const now = nowIso();
  return {
    localId: createId(), serverId: null, deviceId: 'local-device', syncStatus: 'synced' as const, revision: 1, serverRevision: 1, lastSyncedAt: now, createdAt: now, updatedAt: now, deletedAt: null, ...overrides,
  };
}

export async function seedDatabaseIfEmpty() {
  const db = getDb();
  if (await db.exercises.count()) return;
  const now = nowIso();
  const userId = 'local-user';

  const chest: MuscleGroup = { localId: createId(), serverId: null, slug: 'chest', name: 'Chest', region: 'upper', sortOrder: 1, createdAt: now, updatedAt: now };
  const back: MuscleGroup = { localId: createId(), serverId: null, slug: 'back', name: 'Back', region: 'upper', sortOrder: 2, createdAt: now, updatedAt: now };
  const legs: MuscleGroup = { localId: createId(), serverId: null, slug: 'legs', name: 'Legs', region: 'lower', sortOrder: 3, createdAt: now, updatedAt: now };
  const shoulders: MuscleGroup = { localId: createId(), serverId: null, slug: 'shoulders', name: 'Shoulders', region: 'upper', sortOrder: 4, createdAt: now, updatedAt: now };
  const barbell: EquipmentType = { localId: createId(), serverId: null, slug: 'barbell', name: 'Barbell', sortOrder: 1, createdAt: now, updatedAt: now };
  const dumbbell: EquipmentType = { localId: createId(), serverId: null, slug: 'dumbbell', name: 'Dumbbell', sortOrder: 2, createdAt: now, updatedAt: now };
  const machine: EquipmentType = { localId: createId(), serverId: null, slug: 'machine', name: 'Machine', sortOrder: 3, createdAt: now, updatedAt: now };
  const categories: ExerciseCategory[] = [
    { localId: createId(), serverId: null, slug: 'compound', name: 'Compound', sortOrder: 1, createdAt: now, updatedAt: now },
    { localId: createId(), serverId: null, slug: 'isolation', name: 'Isolation', sortOrder: 2, createdAt: now, updatedAt: now },
  ];
  const exercises: Exercise[] = [
    { ...syncMeta(), name: 'Barbell Bench Press', slug: 'push-bench-press', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: barbell.localId, primaryMuscleGroupLocalId: chest.localId, instructionsMarkdown: 'Drive feet. Stack wrists. Press hard.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 100, mediaVersion: 1 },
    { ...syncMeta(), name: 'Incline Dumbbell Press', slug: 'push-incline-dumbbell-press', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: dumbbell.localId, primaryMuscleGroupLocalId: chest.localId, instructionsMarkdown: 'Set scapulae. Full stretch. Strong lockout.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 92, mediaVersion: 1 },
    { ...syncMeta(), name: 'Lat Pulldown', slug: 'pull-lat-pulldown', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: machine.localId, primaryMuscleGroupLocalId: back.localId, instructionsMarkdown: 'Lead with elbows. Keep ribs down.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 95, mediaVersion: 1 },
    { ...syncMeta(), name: 'Barbell Row', slug: 'pull-barbell-row', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: barbell.localId, primaryMuscleGroupLocalId: back.localId, instructionsMarkdown: 'Brace hard. Pull to lower ribs.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 88, mediaVersion: 1 },
    { ...syncMeta(), name: 'Back Squat', slug: 'legs-back-squat', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: barbell.localId, primaryMuscleGroupLocalId: legs.localId, instructionsMarkdown: 'Brace. Sit down between hips. Drive up fast.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 99, mediaVersion: 1 },
    { ...syncMeta(), name: 'Leg Press', slug: 'legs-leg-press', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: machine.localId, primaryMuscleGroupLocalId: legs.localId, instructionsMarkdown: 'Control depth. Drive through whole foot.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 84, mediaVersion: 1 },
    { ...syncMeta(), name: 'Seated Dumbbell Press', slug: 'upper-seated-dumbbell-press', categoryLocalId: categories[0].localId, defaultEquipmentLocalId: dumbbell.localId, primaryMuscleGroupLocalId: shoulders.localId, instructionsMarkdown: 'Stack elbows under wrists.', demoImageKey: null, muscleDiagramKey: null, isCustom: false, isArchived: false, popularityScore: 83, mediaVersion: 1 }
  ];
  const pushTemplate: WorkoutTemplate = { ...syncMeta(), userLocalId: userId, name: 'Push Day', description: 'Chest, shoulders, triceps', splitType: 'push_pull_legs', isSystem: true, isArchived: false };
  const pullTemplate: WorkoutTemplate = { ...syncMeta(), userLocalId: userId, name: 'Pull Day', description: 'Back and biceps focus', splitType: 'push_pull_legs', isSystem: true, isArchived: false };
  const templateExercises: TemplateExercise[] = [
    { ...syncMeta(), templateLocalId: pushTemplate.localId, exerciseLocalId: exercises[0].localId, sortOrder: 1, defaultSetCount: 4, defaultRepMin: 5, defaultRepMax: 8, defaultWeightUnit: 'kg' as const, defaultRestSeconds: 120, notes: null },
    { ...syncMeta(), templateLocalId: pushTemplate.localId, exerciseLocalId: exercises[1].localId, sortOrder: 2, defaultSetCount: 3, defaultRepMin: 8, defaultRepMax: 12, defaultWeightUnit: 'kg' as const, defaultRestSeconds: 90, notes: null },
    { ...syncMeta(), templateLocalId: pullTemplate.localId, exerciseLocalId: exercises[2].localId, sortOrder: 1, defaultSetCount: 4, defaultRepMin: 8, defaultRepMax: 12, defaultWeightUnit: 'kg' as const, defaultRestSeconds: 90, notes: null },
    { ...syncMeta(), templateLocalId: pullTemplate.localId, exerciseLocalId: exercises[3].localId, sortOrder: 2, defaultSetCount: 4, defaultRepMin: 6, defaultRepMax: 10, defaultWeightUnit: 'kg' as const, defaultRestSeconds: 120, notes: null }
  ];
  const completedSession: WorkoutSession = { ...syncMeta(), userLocalId: userId, templateLocalId: pushTemplate.localId, status: 'completed', startedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), endedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 68 * 60000).toISOString(), pausedAt: null, resumedAt: null, sessionNotes: null, activeElapsedMs: 68 * 60000, totalPausedMs: 0, currentExerciseLocalId: null, restStartedAt: null, restTargetSeconds: null, restContextSetLocalId: null, summaryCacheJson: { totalExercises: 2, totalCompletedExercises: 2, totalSets: 7, totalWorkingSets: 7, totalVolumeKg: 3720, durationMs: 68 * 60000, prCount: 1, scorePreview: 184, xpPreview: 72 } };
  const block1: WorkoutSessionExercise = { ...syncMeta(), workoutSessionLocalId: completedSession.localId, exerciseLocalId: exercises[0].localId, sortOrder: 1, blockNotes: null, plannedSetCount: 4, defaultRestSeconds: 120, isCompleted: true, completedAt: completedSession.endedAt, isSuperset: false, supersetKey: null };
  const block2: WorkoutSessionExercise = { ...syncMeta(), workoutSessionLocalId: completedSession.localId, exerciseLocalId: exercises[1].localId, sortOrder: 2, blockNotes: null, plannedSetCount: 3, defaultRestSeconds: 90, isCompleted: true, completedAt: completedSession.endedAt, isSuperset: false, supersetKey: null };
  const completedSets: SetEntry[] = [
    [90,8],[95,8],[100,6],[100,6],
  ].map(([weight,reps], index) => ({ ...syncMeta(), workoutSessionLocalId: completedSession.localId, workoutSessionExerciseLocalId: block1.localId, exerciseLocalId: exercises[0].localId, setNumber: index + 1, setType: 'working' as const, weightValue: weight, weightUnit: 'kg' as const, reps, rir: null, rpe: null, durationSeconds: null, distanceValue: null, distanceUnit: null, isCompleted: true, completedAt: completedSession.endedAt, notes: null, supersedesSetLocalId: null, isDeletedLogical: false })).concat(
      [[32,12],[34,10],[34,10]].map(([weight,reps], index) => ({ ...syncMeta(), workoutSessionLocalId: completedSession.localId, workoutSessionExerciseLocalId: block2.localId, exerciseLocalId: exercises[1].localId, setNumber: index + 1, setType: 'working' as const, weightValue: weight, weightUnit: 'kg' as const, reps, rir: null, rpe: null, durationSeconds: null, distanceValue: null, distanceUnit: null, isCompleted: true, completedAt: completedSession.endedAt, notes: null, supersedesSetLocalId: null, isDeletedLogical: false }))
    );
  const prs: PersonalRecord[] = [
    { ...syncMeta(), userLocalId: userId, exerciseLocalId: exercises[0].localId, prType: 'max_load', valueNumeric: 100, valueUnit: 'kg', sourceSetLocalId: null, sourceWorkoutSessionLocalId: completedSession.localId, achievedAt: completedSession.endedAt!, verifiedByServer: false },
    { ...syncMeta(), userLocalId: userId, exerciseLocalId: exercises[1].localId, prType: 'max_volume_set', valueNumeric: 340, valueUnit: 'volume', sourceSetLocalId: null, sourceWorkoutSessionLocalId: completedSession.localId, achievedAt: completedSession.endedAt!, verifiedByServer: false }
  ];
  const scoreEntry: ScoreHistoryEntry = { ...syncMeta(), userLocalId: userId, workoutSessionLocalId: completedSession.localId, breakdown: { baseCompletion: 100, volumeQuality: 34, progression: 20, structure: 15, goalBonus: 5, streakBonus: 10, penalties: 0, totalScore: 184, explanation: ['Completed planned session', 'Hit one PR'] }, scoreVersion: 1 };
  const xpEntry: XpHistoryEntry = { ...syncMeta(), userLocalId: userId, workoutSessionLocalId: completedSession.localId, eventType: 'session_completed', xpDelta: 72, reasonCode: 'session_summary', metaJson: {} } as any;
  const user: User = { ...syncMeta({ localId: userId }), email: 'local@workoutbro.app', displayName: 'Gordon', avatarUrl: null, timezone: 'America/Jamaica', locale: 'en-JM', bodyWeightKg: 86, currentRankTier: 'bronze_2', currentLevel: 3, totalXp: 72 };
  const prefs: UserPreferences = { ...syncMeta(), userLocalId: userId, defaultWeightUnit: 'kg' as const, defaultRestSeconds: 90, autoStartRestTimer: true, hapticsEnabled: true, soundEnabled: false, darkMode: 'dark', analyticsOptIn: false };
  const goal: Goal = { ...syncMeta(), userLocalId: userId, goalType: 'session_frequency', title: 'Train 4 times this week', description: null, targetJson: { sessions: 4 }, progressJson: { sessions: 1 }, startsAt: now, dueAt: new Date(Date.now()+5*24*3600*1000).toISOString(), status: 'active' };

  await db.users.put(user);
  await db.userPreferences.put(prefs);
  await db.exerciseCategories.bulkPut(categories);
  await db.muscleGroups.bulkPut([chest, back, legs, shoulders]);
  await db.equipmentTypes.bulkPut([barbell, dumbbell, machine]);
  await db.exercises.bulkPut(exercises);
  await db.workoutTemplates.bulkPut([pushTemplate, pullTemplate]);
  await db.templateExercises.bulkPut(templateExercises);
  await db.workoutSessions.put(completedSession);
  await db.workoutSessionExercises.bulkPut([block1, block2]);
  await db.setEntries.bulkPut(completedSets);
  await db.personalRecords.bulkPut(prs);
  await db.scoreHistory.put(scoreEntry);
  await db.xpHistory.put(xpEntry);
  await db.goals.put(goal);
}
