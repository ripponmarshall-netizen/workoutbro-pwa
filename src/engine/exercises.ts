import type { Exercise, Mode, Muscle, Track, TrainStat } from './types';

const ex = (id: string, name: string, modes: Mode[], muscle: Muscle, track: Track, stat: TrainStat): Exercise => ({
  id, name, modes, muscle, track, stat,
});

const G: Mode[] = ['gym'];
const GH: Mode[] = ['gym', 'home'];
const H: Mode[] = ['home'];
const BW: Mode[] = ['bodyweight', 'home', 'gym'];

export const EXERCISES: Exercise[] = [
  // Gym — barbell & machines
  ex('bench', 'Barbell Bench Press', G, 'chest', 'weight', 'str'),
  ex('incline-bench', 'Incline Bench Press', G, 'chest', 'weight', 'str'),
  ex('squat', 'Barbell Back Squat', G, 'legs', 'weight', 'str'),
  ex('front-squat', 'Front Squat', G, 'legs', 'weight', 'str'),
  ex('deadlift', 'Deadlift', G, 'back', 'weight', 'str'),
  ex('rdl', 'Romanian Deadlift', GH, 'legs', 'weight', 'str'),
  ex('ohp', 'Overhead Press', G, 'shoulders', 'weight', 'str'),
  ex('bb-row', 'Barbell Row', G, 'back', 'weight', 'str'),
  ex('lat-pulldown', 'Lat Pulldown', G, 'back', 'weight', 'str'),
  ex('cable-row', 'Seated Cable Row', G, 'back', 'weight', 'str'),
  ex('leg-press', 'Leg Press', G, 'legs', 'weight', 'str'),
  ex('leg-curl', 'Leg Curl', G, 'legs', 'weight', 'str'),
  ex('leg-ext', 'Leg Extension', G, 'legs', 'weight', 'str'),
  ex('chest-fly', 'Cable / Machine Fly', G, 'chest', 'weight', 'str'),
  ex('tricep-pushdown', 'Tricep Pushdown', G, 'arms', 'weight', 'str'),
  ex('hip-thrust', 'Hip Thrust', G, 'legs', 'weight', 'str'),
  ex('treadmill', 'Treadmill Run', G, 'cardio', 'time', 'agi'),
  ex('rower', 'Rowing Machine', G, 'cardio', 'time', 'agi'),
  ex('bike', 'Stationary Bike', GH, 'cardio', 'time', 'agi'),

  // Home equipment — dumbbells, kettlebells, bands
  ex('db-bench', 'Dumbbell Bench Press', GH, 'chest', 'weight', 'str'),
  ex('db-press', 'Dumbbell Shoulder Press', GH, 'shoulders', 'weight', 'str'),
  ex('db-row', 'Dumbbell Row', GH, 'back', 'weight', 'str'),
  ex('goblet-squat', 'Goblet Squat', GH, 'legs', 'weight', 'str'),
  ex('db-lunge', 'Dumbbell Lunge', GH, 'legs', 'weight', 'str'),
  ex('db-curl', 'Dumbbell Curl', GH, 'arms', 'weight', 'str'),
  ex('hammer-curl', 'Hammer Curl', GH, 'arms', 'weight', 'str'),
  ex('db-lateral', 'Lateral Raise', GH, 'shoulders', 'weight', 'str'),
  ex('db-skull', 'Dumbbell Skull Crusher', GH, 'arms', 'weight', 'str'),
  ex('kb-swing', 'Kettlebell Swing', GH, 'full', 'weight', 'end'),
  ex('kb-clean-press', 'Kettlebell Clean & Press', GH, 'full', 'weight', 'str'),
  ex('kb-tgu', 'Turkish Get-Up', GH, 'full', 'weight', 'end'),
  ex('band-pull-apart', 'Band Pull-Apart', H, 'shoulders', 'reps', 'end'),
  ex('band-row', 'Band Row', H, 'back', 'reps', 'end'),
  ex('band-press', 'Band Chest Press', H, 'chest', 'reps', 'end'),
  ex('jump-rope', 'Jump Rope', H, 'cardio', 'time', 'agi'),
  ex('ab-wheel', 'Ab Wheel Rollout', H, 'core', 'reps', 'end'),

  // Bodyweight — anywhere
  ex('pushup', 'Push-up', BW, 'chest', 'reps', 'end'),
  ex('diamond-pushup', 'Diamond Push-up', BW, 'arms', 'reps', 'end'),
  ex('pike-pushup', 'Pike Push-up', BW, 'shoulders', 'reps', 'end'),
  ex('pullup', 'Pull-up', BW, 'back', 'reps', 'str'),
  ex('chinup', 'Chin-up', BW, 'back', 'reps', 'str'),
  ex('dip', 'Dip', BW, 'chest', 'reps', 'str'),
  ex('bw-squat', 'Air Squat', BW, 'legs', 'reps', 'end'),
  ex('lunge', 'Walking Lunge', BW, 'legs', 'reps', 'end'),
  ex('bulgarian', 'Bulgarian Split Squat', BW, 'legs', 'reps', 'end'),
  ex('pistol', 'Pistol Squat', BW, 'legs', 'reps', 'str'),
  ex('glute-bridge', 'Glute Bridge', BW, 'legs', 'reps', 'end'),
  ex('situp', 'Sit-up', BW, 'core', 'reps', 'end'),
  ex('crunch', 'Crunch', BW, 'core', 'reps', 'end'),
  ex('leg-raise', 'Hanging / Lying Leg Raise', BW, 'core', 'reps', 'end'),
  ex('plank', 'Plank', BW, 'core', 'time', 'end'),
  ex('side-plank', 'Side Plank', BW, 'core', 'time', 'end'),
  ex('wall-sit', 'Wall Sit', BW, 'legs', 'time', 'end'),
  ex('burpee', 'Burpee', BW, 'full', 'reps', 'agi'),
  ex('mountain-climber', 'Mountain Climber', BW, 'full', 'time', 'agi'),
  ex('jumping-jack', 'Jumping Jacks', BW, 'cardio', 'reps', 'agi'),
  ex('high-knees', 'High Knees', BW, 'cardio', 'time', 'agi'),
  ex('run', 'Outdoor Run', BW, 'cardio', 'time', 'agi'),
  ex('jump-squat', 'Jump Squat', BW, 'legs', 'reps', 'agi'),
];

export const MODE_META: Record<Mode, { label: string; gate: string; icon: string; blurb: string }> = {
  gym: { label: 'Gym', gate: 'Iron Gate', icon: '🏋️', blurb: 'Barbells, machines, cables' },
  home: { label: 'Home Equipment', gate: 'Home Gate', icon: '🏠', blurb: 'Dumbbells, kettlebells, bands' },
  bodyweight: { label: 'Bodyweight', gate: 'Shadow Gate', icon: '🤸', blurb: 'No equipment, anywhere' },
};

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders',
  arms: 'Arms', core: 'Core', full: 'Full Body', cardio: 'Cardio',
};

export function allExercises(custom: Exercise[]): Exercise[] {
  return [...EXERCISES, ...custom];
}

export function exerciseMap(custom: Exercise[]): Map<string, Exercise> {
  return new Map(allExercises(custom).map((e) => [e.id, e]));
}
