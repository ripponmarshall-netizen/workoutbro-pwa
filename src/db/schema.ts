import Dexie, { Table } from 'dexie';
import type { Achievement, Challenge, EquipmentType, Exercise, ExerciseCategory, ExerciseMuscleMap, Goal, MuscleGroup, PersonalRecord, ScoreHistoryEntry, SetEntry, SyncLogEntry, SyncQueueItem, User, UserAchievement, UserChallengeProgress, UserPreferences, WorkoutSession, WorkoutSessionExercise, WorkoutTemplate, TemplateExercise, XpHistoryEntry } from '../types/domain';

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  userPreferences!: Table<UserPreferences, string>;
  exerciseCategories!: Table<ExerciseCategory, string>;
  muscleGroups!: Table<MuscleGroup, string>;
  equipmentTypes!: Table<EquipmentType, string>;
  exercises!: Table<Exercise, string>;
  exerciseMuscles!: Table<ExerciseMuscleMap, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;
  templateExercises!: Table<TemplateExercise, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  workoutSessionExercises!: Table<WorkoutSessionExercise, string>;
  setEntries!: Table<SetEntry, string>;
  personalRecords!: Table<PersonalRecord, string>;
  scoreHistory!: Table<ScoreHistoryEntry, string>;
  xpHistory!: Table<XpHistoryEntry, string>;
  goals!: Table<Goal, string>;
  challenges!: Table<Challenge, string>;
  userChallenges!: Table<UserChallengeProgress, string>;
  userAchievements!: Table<UserAchievement, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  syncLog!: Table<SyncLogEntry, string>;

  constructor() {
    super('workoutbro_db');
    this.version(1).stores({
      users: '&localId, email, updatedAt',
      userPreferences: '&localId, userLocalId, updatedAt',
      exerciseCategories: '&localId, slug, sortOrder',
      muscleGroups: '&localId, slug, region, sortOrder',
      equipmentTypes: '&localId, slug, sortOrder',
      exercises: '&localId, name, slug, primaryMuscleGroupLocalId, defaultEquipmentLocalId, updatedAt',
      exerciseMuscles: '&localId, exerciseLocalId, muscleGroupLocalId, role',
      workoutTemplates: '&localId, userLocalId, updatedAt',
      templateExercises: '&localId, templateLocalId, [templateLocalId+sortOrder], exerciseLocalId',
      workoutSessions: '&localId, userLocalId, status, startedAt, [userLocalId+startedAt]',
      workoutSessionExercises: '&localId, workoutSessionLocalId, [workoutSessionLocalId+sortOrder], exerciseLocalId, updatedAt',
      setEntries: '&localId, workoutSessionLocalId, workoutSessionExerciseLocalId, exerciseLocalId, completedAt, setNumber',
      personalRecords: '&localId, exerciseLocalId, [exerciseLocalId+prType], achievedAt',
      scoreHistory: '&localId, userLocalId, workoutSessionLocalId, createdAt',
      xpHistory: '&localId, userLocalId, workoutSessionLocalId, createdAt',
      goals: '&localId, userLocalId, status',
      challenges: '&localId',
      userChallenges: '&localId, userLocalId, challengeLocalId',
      userAchievements: '&localId, userLocalId, achievementCode',
      syncQueue: '&id, status, createdAt, entityType',
      syncLog: '&id, createdAt, entityType'
    });
  }
}
