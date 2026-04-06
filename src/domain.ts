export type ISODateString = string;
export type UUID = string;
export type JsonObject = Record<string, unknown>;

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'm' | 'km' | 'mi';
export type MeasurementUnit = 'kg' | 'lb' | 'cm' | 'in' | '%' | 'bpm';

export type SetType = 'warmup' | 'working' | 'drop' | 'amrap' | 'failure' | 'backoff';
export type WorkoutStatus = 'active' | 'paused' | 'completed' | 'discarded';
export type SyncStatus = 'local_only' | 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type SyncQueueStatus = 'pending' | 'processing' | 'retry_scheduled' | 'failed' | 'dead_letter' | 'completed';
export type ChallengeStatus = 'not_started' | 'active' | 'completed' | 'expired' | 'cancelled';
export type AchievementPrestige = 'common' | 'rare' | 'epic' | 'legendary';
export type RankTier =
  | 'bronze_1' | 'bronze_2' | 'bronze_3'
  | 'silver_1' | 'silver_2' | 'silver_3'
  | 'gold_1' | 'gold_2' | 'gold_3'
  | 'platinum_1' | 'platinum_2'
  | 'diamond'
  | 'elite';
export type ScoreEventType =
  | 'session_completed'
  | 'exercise_completed'
  | 'pr_awarded'
  | 'goal_progress'
  | 'goal_completed'
  | 'challenge_progress'
  | 'challenge_completed'
  | 'streak_bonus'
  | 'penalty';

export type MutationType = 'create' | 'update' | 'delete' | 'complete' | 'upsert' | 'upload';
export type EntityType =
  | 'exercise'
  | 'workoutTemplate'
  | 'templateExercise'
  | 'workoutSession'
  | 'workoutSessionExercise'
  | 'setEntry'
  | 'personalRecord'
  | 'scoreHistory'
  | 'xpHistory'
  | 'userAchievement'
  | 'goal'
  | 'userChallengeProgress';

export interface SyncMeta {
  localId: UUID;
  serverId: string | null;
  deviceId: string;
  syncStatus: SyncStatus;
  revision: number;
  serverRevision: number | null;
  lastSyncedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
}

export interface User extends SyncMeta {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  bodyWeightKg: number | null;
  currentRankTier: RankTier | null;
  currentLevel: number | null;
  totalXp: number | null;
}

export interface UserPreferences extends SyncMeta {
  userLocalId: UUID;
  defaultWeightUnit: WeightUnit;
  defaultRestSeconds: number;
  autoStartRestTimer: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: 'system' | 'light' | 'dark';
  analyticsOptIn: boolean;
}

export interface ExerciseCategory {
  localId: UUID;
  serverId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MuscleGroup {
  localId: UUID;
  serverId: string | null;
  slug: string;
  name: string;
  region: 'upper' | 'lower' | 'core' | 'full_body';
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EquipmentType {
  localId: UUID;
  serverId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Exercise extends SyncMeta {
  name: string;
  slug: string;
  categoryLocalId: UUID | null;
  defaultEquipmentLocalId: UUID | null;
  primaryMuscleGroupLocalId: UUID | null;
  instructionsMarkdown: string | null;
  demoImageKey: string | null;
  muscleDiagramKey: string | null;
  isCustom: boolean;
  isArchived: boolean;
  popularityScore: number | null;
  mediaVersion: number;
}

export interface ExerciseMuscleMap {
  localId: UUID;
  serverId: string | null;
  exerciseLocalId: UUID;
  muscleGroupLocalId: UUID;
  role: 'primary' | 'secondary' | 'stabilizer';
  weighting: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WorkoutTemplate extends SyncMeta {
  userLocalId: UUID;
  name: string;
  description: string | null;
  splitType: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom';
  isSystem: boolean;
  isArchived: boolean;
}

export interface TemplateExercise extends SyncMeta {
  templateLocalId: UUID;
  exerciseLocalId: UUID;
  sortOrder: number;
  defaultSetCount: number;
  defaultRepMin: number | null;
  defaultRepMax: number | null;
  defaultWeightUnit: WeightUnit;
  defaultRestSeconds: number | null;
  notes: string | null;
}

export interface SessionSummaryCache {
  totalExercises: number;
  totalCompletedExercises: number;
  totalSets: number;
  totalWorkingSets: number;
  totalVolumeKg: number;
  durationMs: number;
  prCount: number;
  scorePreview: number | null;
  xpPreview: number | null;
}

export interface WorkoutSession extends SyncMeta {
  userLocalId: UUID;
  templateLocalId: UUID | null;
  status: WorkoutStatus;
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  pausedAt: ISODateString | null;
  resumedAt: ISODateString | null;
  sessionNotes: string | null;
  activeElapsedMs: number;
  totalPausedMs: number;
  currentExerciseLocalId: UUID | null;
  summaryCacheJson: SessionSummaryCache | null;
  restStartedAt: ISODateString | null;
  restTargetSeconds: number | null;
  restContextSetLocalId: UUID | null;
}

export interface WorkoutSessionExercise extends SyncMeta {
  workoutSessionLocalId: UUID;
  exerciseLocalId: UUID;
  sortOrder: number;
  blockNotes: string | null;
  plannedSetCount: number | null;
  defaultRestSeconds: number | null;
  isCompleted: boolean;
  completedAt: ISODateString | null;
  isSuperset: boolean;
  supersetKey: string | null;
}

export interface SetEntry extends SyncMeta {
  workoutSessionLocalId: UUID;
  workoutSessionExerciseLocalId: UUID;
  exerciseLocalId: UUID;
  setNumber: number;
  setType: SetType;
  weightValue: number | null;
  weightUnit: WeightUnit | null;
  reps: number | null;
  rir: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceValue: number | null;
  distanceUnit: DistanceUnit | null;
  isCompleted: boolean;
  completedAt: ISODateString | null;
  notes: string | null;
  supersedesSetLocalId: UUID | null;
  isDeletedLogical: boolean;
}

export interface PersonalRecord extends SyncMeta {
  userLocalId: UUID;
  exerciseLocalId: UUID;
  prType: 'max_load' | 'max_reps' | 'max_volume_set' | 'estimated_1rm';
  valueNumeric: number;
  valueUnit: WeightUnit | 'reps' | 'volume';
  sourceSetLocalId: UUID | null;
  sourceWorkoutSessionLocalId: UUID | null;
  achievedAt: ISODateString;
  verifiedByServer: boolean;
}

export interface WorkoutScoreBreakdown {
  baseCompletion: number;
  volumeQuality: number;
  progression: number;
  structure: number;
  goalBonus: number;
  streakBonus: number;
  penalties: number;
  totalScore: number;
  explanation: string[];
}

export interface ScoreHistoryEntry extends SyncMeta {
  userLocalId: UUID;
  workoutSessionLocalId: UUID;
  breakdown: WorkoutScoreBreakdown;
  scoreVersion: number;
}

export interface XpHistoryEntry extends SyncMeta {
  userLocalId: UUID;
  workoutSessionLocalId: UUID | null;
  eventType: ScoreEventType;
  xpDelta: number;
  reasonCode: string;
  metaJson: JsonObject | null;
}

export interface RankSnapshot extends SyncMeta {
  userLocalId: UUID;
  totalXp: number;
  level: number;
  rankTier: RankTier;
  effectiveAt: ISODateString;
}

export interface Achievement {
  localId: UUID;
  serverId: string | null;
  code: string;
  title: string;
  description: string;
  prestige: AchievementPrestige;
  criteriaJson: JsonObject;
  xpReward: number;
  iconKey: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserAchievement extends SyncMeta {
  userLocalId: UUID;
  achievementCode: string;
  unlockedAt: ISODateString;
  sourceWorkoutSessionLocalId: UUID | null;
  metaJson: JsonObject | null;
}

export interface Goal extends SyncMeta {
  userLocalId: UUID;
  goalType: 'weight_target' | 'session_frequency' | 'exercise_pr' | 'body_measurement' | 'consistency';
  title: string;
  description: string | null;
  targetJson: JsonObject;
  progressJson: JsonObject;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startsAt: ISODateString | null;
  dueAt: ISODateString | null;
}

export interface Challenge extends SyncMeta {
  title: string;
  description: string | null;
  category: 'volume' | 'frequency' | 'strength' | 'consistency' | 'event';
  criteriaJson: JsonObject;
  rewardJson: JsonObject | null;
  startsAt: ISODateString | null;
  endsAt: ISODateString | null;
  isServerManaged: boolean;
}

export interface UserChallengeProgress extends SyncMeta {
  userLocalId: UUID;
  challengeLocalId: UUID;
  status: ChallengeStatus;
  progressJson: JsonObject;
  joinedAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface BodyMeasurementEntry extends SyncMeta {
  userLocalId: UUID;
  measurementType:
    | 'body_weight'
    | 'body_fat_percent'
    | 'waist'
    | 'chest'
    | 'arm'
    | 'thigh'
    | 'hip'
    | 'resting_hr';
  value: number;
  unit: MeasurementUnit;
  measuredAt: ISODateString;
  notes: string | null;
}

export interface ProgressPhoto extends SyncMeta {
  userLocalId: UUID;
  capturedAt: ISODateString;
  bodyRegion: 'front' | 'side' | 'back' | 'custom';
  note: string | null;
  localBlobRef: string | null;
  localThumbnailRef: string | null;
  uploadStatus: 'local_only' | 'pending_upload' | 'uploading' | 'uploaded' | 'failed';
  remoteUrl: string | null;
}

export interface SyncQueueItem {
  id: UUID;
  entityType: EntityType;
  entityLocalId: UUID;
  entityServerId: string | null;
  mutationType: MutationType;
  payload: JsonObject;
  idempotencyKey: string;
  dependencyKey: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  attemptCount: number;
  nextRetryAt: ISODateString | null;
  status: SyncQueueStatus;
  priority: number;
  lastError: string | null;
  lastAttemptAt: ISODateString | null;
  requestHash: string | null;
}

export interface SyncLogEntry {
  id: UUID;
  queueItemId: UUID;
  entityType: EntityType;
  entityLocalId: UUID;
  entityServerId: string | null;
  idempotencyKey: string;
  result: 'applied' | 'duplicate' | 'failed' | 'conflict';
  serverRevision: number | null;
  serverTimestamp: ISODateString | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: ISODateString;
}

export interface PreviousPerformanceSnapshot {
  exerciseLocalId: UUID;
  lastPerformedAt: ISODateString | null;
  lastWeightValue: number | null;
  lastWeightUnit: WeightUnit | null;
  lastReps: number | null;
  lastSetCount: number;
  recentBestLoad: number | null;
  recentBestReps: number | null;
  recentEstimated1RM: number | null;
}

export interface RecoveryStatus {
  hasRecoverableSession: boolean;
  session: WorkoutSession | null;
  sessionExercises: WorkoutSessionExercise[];
  sets: SetEntry[];
  isStale: boolean;
  staleMinutes: number | null;
}
