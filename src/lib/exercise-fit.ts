// Port of the exercise fit rules of the Fittë API (routines/adjust/exercise-fit.ts), comments removed.
// It swaps the exercises of a template that need other equipment or that load an area the person wants to avoid.
// The area lists are a cautious heuristic from biomechanics and expert opinion, not a clinical rule: being on a list
// does not say an exercise is bad, only that it is reasonable to start with another one if that area hurts.

export const AREAS = [
  'KNEE',
  'SHOULDER',
  'LOWER_BACK',
  'ELBOW',
  'WRIST',
  'HIP',
  'NECK',
] as const;
export type Area = (typeof AREAS)[number];

export const EQUIPMENT_PREFERENCES = [
  'FULL_GYM',
  'FREE_WEIGHTS',
  'MACHINES',
  'HOME',
] as const;
export type EquipmentPreference = (typeof EQUIPMENT_PREFERENCES)[number];

export const AREA_MODES = ['AVOID', 'GRADUAL'] as const;
export type AreaMode = (typeof AREA_MODES)[number];

export interface AreaChoice {
  area: Area;
  mode: AreaMode;
}

export type Reason = Area | 'EQUIPMENT';

export interface FitExercise {
  id: number;
  slug: string;
  equipment: string | null;
  bodyPart: string;
  mechanic: string | null;
  difficulty: string;
  primaryMuscles: string[];
}

interface AreaRule {
  matches: RegExp[];
  except?: RegExp[];
}

const DIPS = /(^|-)dips?(-|$)/;

const AREA_RULES: Record<Area, AreaRule> = {
  KNEE: {
    matches: [
      /squat/,
      /pistol/,
      /lunge/,
      /step-up/,
      /leg-extension/,
      /leg-press/,
      /wall-sit/,
      /chair-pose/,
      /thruster/,
      /nordic/,
      /cossack/,
      /warrior/,
      /crescent/,
      /bear-crawl/,
      /sissy/,
    ],
    except: [/calf-raise/],
  },
  SHOULDER: {
    matches: [
      /overhead/,
      /(^|-)ohp($|-)/,
      /shoulder-press/,
      /push-press/,
      /arnold/,
      /thruster/,
      /jerk/,
      /handstand/,
      /pike-push/,
      /behind-the-neck/,
      /upright-row/,
      /high-pull/,
      /dolphin/,
      /muscle-up/,
      DIPS,
      /pullover/,
      /front-lever|back-lever|planche|human-flag/,
    ],
  },
  LOWER_BACK: {
    matches: [
      /deadlift/,
      /good-morning/,
      /rdl/,
      /romanian/,
      /stiff-leg/,
      /rack-pull/,
      /barbell-row|bent-over|pendlay|t-bar-row/,
      /back-extension/,
      /superman/,
      /jefferson/,
      /swing/,
      /clean/,
      /snatch/,
      /windmill/,
      /sit-up/,
      /jackknife/,
      /v-up|v-sit/,
      /russian-twist/,
      /^(front-|overhead-|pause-|box-)?squat$/,
    ],
  },
  ELBOW: {
    matches: [
      /skull-crusher/,
      /lying-tricep/,
      /overhead-(tricep-)?extension/,
      /triceps?-extension/,
      DIPS,
      /preacher/,
      /spider-curl/,
      /reverse-curl/,
      /zottman/,
      /close-grip-(ez-bar-|db-)?bench/,
    ],
  },
  WRIST: {
    matches: [
      /wrist/,
      /push-up/,
      /high-plank|reverse-plank|downward-dog-to-plank/,
      /handstand/,
      /downward-dog/,
      /three-legged-dog/,
      /crow-pose/,
      /planche/,
      /bear-crawl/,
      DIPS,
      /human-flag/,
      /pike/,
      /l-sit/,
      /front-squat/,
      /clean/,
      /dolphin/,
    ],
  },
  HIP: {
    matches: [
      /squat/,
      /sumo/,
      /cossack/,
      /pistol/,
      /lunge/,
      /split/,
      /step-up/,
      /leg-press/,
      /hanging-(knee|leg)-raise/,
      /toes-to-bar/,
      /captains-chair/,
      /hip-adduction/,
      /extended-side-angle/,
      /warrior/,
    ],
    except: [/calf-raise/],
  },
  NECK: {
    matches: [
      /behind-the-neck/,
      /shoulderstand/,
      /handstand/,
      /headstand/,
      /jefferson/,
      /sit-up/,
      /neck-bridge/,
      /dolphin/,
    ],
    except: [/isometric-neck|chin-tuck/],
  },
};

const loadedAreasBySlug = new Map<string, Area[]>();

export function loadedAreas(slug: string): Area[] {
  let areas = loadedAreasBySlug.get(slug);
  if (!areas) {
    areas = AREAS.filter((area) => {
      const rule = AREA_RULES[area];
      return (
        rule.matches.some((pattern) => pattern.test(slug)) &&
        !(rule.except ?? []).some((pattern) => pattern.test(slug))
      );
    });
    loadedAreasBySlug.set(slug, areas);
  }
  return [...areas];
}

const FREE_WEIGHTS = new Set([
  'barbell',
  'ez_bar',
  'trap_bar',
  'plates',
  'dumbbell',
  'kettlebell',
]);
const BODYWEIGHT = new Set([
  'pull_up_bar',
  'dip_station',
  'rings',
  'suspension_trainer',
  'ab_wheel',
  'stability_ball',
  'loop_band',
  'resistance_band',
  'climbing_rope',
  'wrist_roller',
  'slam_ball',
]);
const HOME = new Set([
  'dumbbell',
  'kettlebell',
  'loop_band',
  'resistance_band',
  'pull_up_bar',
  'suspension_trainer',
  'rings',
  'stability_ball',
  'ab_wheel',
  'wrist_roller',
]);
const MACHINE_NAMES = new Set([
  'cable',
  'smith_machine',
  'leg_press',
  'hack_squat',
  'leg_curl',
  'leg_extension',
  'pec_deck',
  'glute_ham_developer',
]);

const isMachine = (equipment: string) =>
  MACHINE_NAMES.has(equipment) || equipment.endsWith('_machine');

type EquipmentClass = 'FREE' | 'MACHINE' | 'BODY' | 'OTHER';

function equipmentClass(equipment: string | null): EquipmentClass {
  if (equipment === null || BODYWEIGHT.has(equipment)) return 'BODY';
  if (FREE_WEIGHTS.has(equipment)) return 'FREE';
  if (isMachine(equipment)) return 'MACHINE';
  return 'OTHER';
}

export function equipmentAllowed(
  preference: EquipmentPreference,
  equipment: string | null,
): boolean {
  switch (preference) {
    case 'FULL_GYM':
      return true;
    case 'FREE_WEIGHTS':
      return (
        equipment === null ||
        FREE_WEIGHTS.has(equipment) ||
        BODYWEIGHT.has(equipment)
      );
    case 'MACHINES':
      return (
        equipment === null || isMachine(equipment) || BODYWEIGHT.has(equipment)
      );
    case 'HOME':
      return equipment === null || HOME.has(equipment);
  }
}

export interface AdjustDay {
  order: number;
  exercises: FitExercise[];
}

export interface AdjustInput {
  days: AdjustDay[];
  library: FitExercise[];
  equipment: EquipmentPreference;
  areas: AreaChoice[];
}

export interface SuggestedSwap {
  dayOrder: number;
  exerciseId: number;
  replacementId: number;
  reasons: Reason[];
}

export interface AdjustResult {
  swaps: SuggestedSwap[];
  gradual: { dayOrder: number; exerciseId: number; areas: Area[] }[];
  unresolved: { dayOrder: number; exerciseId: number; reasons: Reason[] }[];
}

const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
const difficultyRank = (difficulty: string) =>
  Math.max(0, DIFFICULTY.indexOf(difficulty));

function similarity(original: FitExercise, candidate: FitExercise) {
  const shared = candidate.primaryMuscles.filter((muscle) =>
    original.primaryMuscles.includes(muscle),
  );
  if (shared.length === 0 || candidate.bodyPart !== original.bodyPart) {
    return null;
  }
  let score =
    candidate.primaryMuscles[0] === original.primaryMuscles[0] ? 100 : 60;
  if (candidate.mechanic === original.mechanic) score += 30;
  if (
    equipmentClass(candidate.equipment) === equipmentClass(original.equipment)
  ) {
    score += 15;
  }
  return (
    score -
    10 *
      Math.abs(
        difficultyRank(candidate.difficulty) -
          difficultyRank(original.difficulty),
      )
  );
}

export function rankedCandidates(
  original: FitExercise,
  library: FitExercise[],
  options: {
    equipment: EquipmentPreference;
    avoid: Area[];
    taken: ReadonlySet<number>;
  },
): FitExercise[] {
  return library
    .filter(
      (candidate) =>
        candidate.mechanic !== null &&
        !options.taken.has(candidate.id) &&
        equipmentAllowed(options.equipment, candidate.equipment) &&
        !loadedAreas(candidate.slug).some((area) =>
          options.avoid.includes(area),
        ),
    )
    .map((candidate) => ({ candidate, score: similarity(original, candidate) }))
    .filter(
      (entry): entry is { candidate: FitExercise; score: number } =>
        entry.score !== null,
    )
    .sort((a, b) => b.score - a.score || a.candidate.id - b.candidate.id)
    .map((entry) => entry.candidate);
}

export function areasWith(areas: AreaChoice[], mode: AreaMode): Area[] {
  return AREAS.filter((area) =>
    areas.some((choice) => choice.area === area && choice.mode === mode),
  );
}

export function adjustDays(input: AdjustInput): AdjustResult {
  const avoid = areasWith(input.areas, 'AVOID');
  const gradualAreas = areasWith(input.areas, 'GRADUAL');

  const result: AdjustResult = { swaps: [], gradual: [], unresolved: [] };

  for (const day of [...input.days].sort((a, b) => a.order - b.order)) {
    const taken = new Set(day.exercises.map((exercise) => exercise.id));

    for (const exercise of day.exercises) {
      const loaded = loadedAreas(exercise.slug);
      const reasons: Reason[] = loaded.filter((area) => avoid.includes(area));
      if (!equipmentAllowed(input.equipment, exercise.equipment)) {
        reasons.push('EQUIPMENT');
      }

      if (reasons.length === 0) {
        const careful = loaded.filter((area) => gradualAreas.includes(area));
        if (careful.length > 0) {
          result.gradual.push({
            dayOrder: day.order,
            exerciseId: exercise.id,
            areas: careful,
          });
        }
        continue;
      }

      const [best] = rankedCandidates(exercise, input.library, {
        equipment: input.equipment,
        avoid,
        taken,
      });
      if (best) {
        taken.add(best.id);
        result.swaps.push({
          dayOrder: day.order,
          exerciseId: exercise.id,
          replacementId: best.id,
          reasons,
        });
      } else {
        result.unresolved.push({
          dayOrder: day.order,
          exerciseId: exercise.id,
          reasons,
        });
      }
    }
  }
  result.gradual.push(
    ...replacementCare(gradualAreas, result.swaps, input.library),
  );
  return result;
}

export function replacementCare(
  gradualAreas: Area[],
  swaps: SuggestedSwap[],
  library: FitExercise[],
): AdjustResult['gradual'] {
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  return swaps.flatMap((swap) => {
    const replacement = byId.get(swap.replacementId);
    const areas = replacement
      ? loadedAreas(replacement.slug).filter((area) =>
          gradualAreas.includes(area),
        )
      : [];
    return areas.length > 0
      ? [{ dayOrder: swap.dayOrder, exerciseId: swap.replacementId, areas }]
      : [];
  });
}
