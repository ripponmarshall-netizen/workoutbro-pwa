export type Mode = 'gym' | 'home' | 'bodyweight';
/** weight = load × reps, reps = reps only, time = seconds held/performed */
export type Track = 'weight' | 'reps' | 'time';
export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full' | 'cardio';
/** Stats that individual exercises train. VIT and WIL come from consistency. */
export type TrainStat = 'str' | 'agi' | 'end';

export interface Exercise {
  id: string;
  name: string;
  modes: Mode[];
  muscle: Muscle;
  track: Track;
  stat: TrainStat;
  custom?: boolean;
}

export interface SetEntry {
  id: string;
  /** Always stored in kg */
  weight?: number;
  reps?: number;
  seconds?: number;
  done: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
}

export interface ActiveWorkout {
  id: string;
  mode: Mode;
  startedAt: number;
  exercises: WorkoutExercise[];
  /** Rest timer end (epoch ms) — kept here so it survives tab switches and reloads */
  restEnd?: number;
}

export interface PrHit {
  exerciseId: string;
  kind: 'e1rm' | 'reps' | 'time';
  value: number;
}

export interface Session {
  id: string;
  mode: Mode;
  startedAt: number;
  endedAt: number;
  exercises: WorkoutExercise[];
  xp: number;
  prs: PrHit[];
}

export interface Profile {
  name: string;
  unit: 'kg' | 'lb';
  sound: boolean;
  weeklyGoal: number;
  /** Badge id whose title is equipped */
  title: string | null;
  /** When a backup was last exported (epoch ms) */
  lastBackup?: number;
}

export interface AppState {
  version: 1;
  profile: Profile;
  sessions: Session[];
  customExercises: Exercise[];
  active: ActiveWorkout | null;
  /** badgeId -> unlocked timestamp */
  badges: Record<string, number>;
  /** dateKey -> bonus xp claimed */
  questClaims: Record<string, number>;
}
