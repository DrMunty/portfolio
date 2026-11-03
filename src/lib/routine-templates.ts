// The routine templates of the Fittë API (routines/templates/routine-templates.data.ts), with English names.
// They are the templates Fittë offers today; the API marks them as provisional until the coach's final ones arrive.
export const REST = 'REST';

export interface TemplateExercise {
  exercise: string;
  sets: number;
  repsMin: number;
  repsMax: number;
}

export interface Session {
  name: string;
  // Spanish name, only where it differs from the English one (the app uses these for the bro split).
  nameEs?: string;
  exercises: TemplateExercise[];
}

export interface Template {
  key: string;
  name: string;
  daysPerWeek: number;
  // Always seven entries: a key of SESSIONS or REST.
  cycle: string[];
}

const ex = (exercise: string, sets: number, repsMin: number, repsMax: number): TemplateExercise => ({
  exercise,
  sets,
  repsMin,
  repsMax,
});

export const SESSIONS: Record<string, Session> = {
  FB_A: {
    name: 'Full Body A',
    exercises: [
      ex('leg-press', 3, 8, 12), ex('db-bench-press', 3, 8, 12), ex('lat-pulldown', 3, 8, 12),
      ex('seated-leg-curl', 3, 10, 15), ex('lateral-raise', 3, 10, 15), ex('cable-crunch', 3, 10, 15),
    ],
  },
  FB_B: {
    name: 'Full Body B',
    exercises: [
      ex('dumbbell-romanian-deadlift', 3, 8, 12), ex('dumbbell-shoulder-press', 3, 8, 12), ex('seated-cable-row', 3, 8, 12),
      ex('incline-db-press', 3, 8, 12), ex('leg-extension', 3, 10, 15), ex('hanging-leg-raise', 3, 10, 15),
    ],
  },
  FB_C: {
    name: 'Full Body C',
    exercises: [
      ex('squat', 4, 6, 10), ex('chest-press-machine', 3, 8, 12), ex('chest-supported-db-row', 3, 8, 12),
      ex('hip-thrust', 3, 8, 12), ex('tricep-pushdown', 3, 10, 15), ex('bicep-curl', 3, 10, 15),
    ],
  },
  UPPER_A: {
    name: 'Upper A',
    exercises: [
      ex('bench-press', 4, 6, 10), ex('seated-cable-row', 4, 6, 10), ex('dumbbell-shoulder-press', 3, 8, 12),
      ex('lat-pulldown', 3, 8, 12), ex('lateral-raise', 3, 10, 15), ex('tricep-pushdown', 3, 10, 15), ex('bicep-curl', 3, 10, 15),
    ],
  },
  LOWER_A: {
    name: 'Lower A',
    exercises: [
      ex('squat', 4, 6, 10), ex('romanian-deadlift', 3, 8, 12), ex('leg-press', 3, 8, 12),
      ex('seated-leg-curl', 3, 10, 15), ex('machine-calf-raise', 4, 12, 15), ex('cable-crunch', 3, 10, 15),
    ],
  },
  UPPER_B: {
    name: 'Upper B',
    exercises: [
      ex('incline-db-press', 4, 8, 12), ex('chest-supported-db-row', 4, 8, 12), ex('machine-shoulder-press', 3, 8, 12),
      ex('cable-fly', 3, 10, 15), ex('face-pull', 3, 10, 15), ex('overhead-tricep-extension', 3, 10, 15), ex('hammer-curl', 3, 10, 15),
    ],
  },
  LOWER_B: {
    name: 'Lower B',
    exercises: [
      ex('hip-thrust', 4, 8, 12), ex('bulgarian-split-squat', 3, 8, 12), ex('leg-curl', 3, 10, 15),
      ex('leg-extension', 3, 10, 15), ex('seated-calf-raise', 4, 12, 15), ex('hanging-leg-raise', 3, 10, 15),
    ],
  },
  PUSH: {
    name: 'Push',
    exercises: [
      ex('incline-bench-press', 4, 6, 10), ex('dumbbell-shoulder-press', 3, 8, 12), ex('cable-fly', 3, 10, 15),
      ex('lateral-raise', 4, 10, 15), ex('tricep-pushdown', 3, 10, 15), ex('overhead-tricep-extension', 3, 10, 15),
    ],
  },
  PULL: {
    name: 'Pull',
    exercises: [
      ex('lat-pulldown', 4, 8, 12), ex('seated-cable-row', 3, 8, 12), ex('face-pull', 3, 10, 15),
      ex('dumbbell-reverse-fly', 3, 10, 15), ex('preacher-curl', 3, 10, 15), ex('hammer-curl', 3, 10, 15),
    ],
  },
  LEGS: {
    name: 'Legs',
    exercises: [
      ex('hack-squat', 4, 8, 12), ex('dumbbell-romanian-deadlift', 3, 8, 12), ex('leg-press', 3, 10, 15),
      ex('leg-extension', 3, 10, 15), ex('leg-curl', 3, 10, 15), ex('machine-calf-raise', 4, 12, 15),
    ],
  },
  BRO_CHEST: {
    name: 'Chest',
    nameEs: 'Pecho',
    exercises: [
      ex('bench-press', 4, 6, 10), ex('incline-db-press', 3, 8, 12), ex('chest-press-machine', 3, 8, 12),
      ex('cable-fly', 3, 10, 15), ex('pec-deck', 3, 10, 15),
    ],
  },
  BRO_BACK: {
    name: 'Back',
    nameEs: 'Espalda',
    exercises: [
      ex('lat-pulldown', 4, 8, 12), ex('seated-cable-row', 4, 8, 12), ex('single-arm-db-row', 3, 8, 12),
      ex('chest-supported-db-row', 3, 8, 12), ex('back-extension', 3, 10, 15),
    ],
  },
  BRO_SHOULDERS: {
    name: 'Shoulders',
    nameEs: 'Hombro',
    exercises: [
      ex('dumbbell-shoulder-press', 4, 8, 12), ex('lateral-raise', 4, 10, 15), ex('dumbbell-reverse-fly', 3, 10, 15),
      ex('face-pull', 3, 10, 15), ex('db-shrug', 3, 10, 15),
    ],
  },
  BRO_ARMS: {
    name: 'Arms',
    nameEs: 'Brazo',
    exercises: [
      ex('bicep-curl', 4, 8, 12), ex('incline-db-curl', 3, 10, 15), ex('hammer-curl', 3, 10, 15),
      ex('tricep-pushdown', 4, 10, 15), ex('skull-crusher', 3, 8, 12), ex('overhead-tricep-extension', 3, 10, 15),
    ],
  },
  BRO_LEGS: {
    name: 'Legs',
    nameEs: 'Pierna',
    exercises: [
      ex('squat', 4, 6, 10), ex('leg-press', 3, 10, 15), ex('romanian-deadlift', 3, 8, 12),
      ex('leg-extension', 3, 10, 15), ex('leg-curl', 3, 10, 15), ex('machine-calf-raise', 4, 12, 15),
    ],
  },
};

export const TEMPLATES: Template[] = [
  { key: 'FULL_BODY_1', name: 'Full Body', daysPerWeek: 1, cycle: ['FB_A', REST, REST, REST, REST, REST, REST] },
  { key: 'FULL_BODY_2', name: 'Full Body', daysPerWeek: 2, cycle: ['FB_A', REST, REST, 'FB_B', REST, REST, REST] },
  { key: 'FULL_BODY_3', name: 'Full Body', daysPerWeek: 3, cycle: ['FB_A', REST, 'FB_B', REST, 'FB_C', REST, REST] },
  { key: 'UPPER_LOWER_4', name: 'Upper / Lower', daysPerWeek: 4, cycle: ['UPPER_A', 'LOWER_A', REST, 'UPPER_B', 'LOWER_B', REST, REST] },
  { key: 'UPPER_LOWER_PPL_5', name: 'Upper / Lower + Push Pull Legs', daysPerWeek: 5, cycle: ['UPPER_A', 'LOWER_A', REST, 'PUSH', 'PULL', 'LEGS', REST] },
  { key: 'BRO_SPLIT_5', name: 'Bro Split', daysPerWeek: 5, cycle: ['BRO_CHEST', 'BRO_BACK', 'BRO_SHOULDERS', 'BRO_ARMS', 'BRO_LEGS', REST, REST] },
];
