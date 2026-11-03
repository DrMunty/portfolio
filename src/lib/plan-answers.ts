// The "Your training" step of the Fittë routine assistant as pure functions: sets, reps, structure, RIR and rest for the
// whole routine, the values recommended for each experience, and how they read. A port of plan.util.ts and
// plan-answers.util.ts of the app without the per-exercise customisation and the "Other" free inputs.
import { t } from '../i18n';
import type { Experience } from './routine-assistant';

export type SetStructure = 'TOP_BACKOFF' | 'STRAIGHT' | 'PYRAMID';

export const MIN_SETS = 1;
export const MAX_SETS = 30;
export const MAX_RIR = 5;
export const MIN_PYRAMID_SETS = 2;
export const REST_PRESETS: readonly number[] = [60, 90, 120, 180];
export const REPS_PRESETS: readonly (readonly [number, number])[] = [[6, 10], [8, 12], [10, 15], [12, 20]];
export const TOP_REPS_PRESETS: readonly (readonly [number, number])[] = [[4, 6], [6, 8], [8, 10]];
export const BACKOFF_REPS_PRESETS: readonly (readonly [number, number])[] = [[8, 10], [10, 12], [12, 15]];
const DEFAULT_TOP_REPS = TOP_REPS_PRESETS[1];
const DEFAULT_BACKOFF_REPS = BACKOFF_REPS_PRESETS[0];

export const STRUCTURES: readonly SetStructure[] = ['TOP_BACKOFF', 'STRAIGHT', 'PYRAMID'];

export const defaultRestFor = (mechanic: string | null): number => (mechanic === 'compound' ? 120 : 90);

const DEFAULT_TOP_SET_RIR = 1;
const DEFAULT_BACKOFF_RIR = 2;
const DEFAULT_STRAIGHT_RIR = 2;

export function buildRir(sets: number, top?: number, backoff?: number, structure: SetStructure = 'TOP_BACKOFF'): number[] {
  if (structure === 'STRAIGHT') {
    const rir = top ?? backoff ?? DEFAULT_STRAIGHT_RIR;
    return Array.from({ length: sets }, () => rir);
  }
  const topRir = top ?? DEFAULT_TOP_SET_RIR;
  const backoffRir = backoff ?? DEFAULT_BACKOFF_RIR;
  const hardest = structure === 'PYRAMID' ? sets - 1 : 0;
  return Array.from({ length: sets }, (_, index) => (index === hardest ? topRir : backoffRir));
}

export function spreadReps(sets: number, repsMin: number, repsMax: number): number[] {
  return Array.from({ length: sets }, (_, index) =>
    sets === 1 ? repsMax : Math.round(repsMax - ((repsMax - repsMin) * index) / (sets - 1)),
  );
}

export function formatRest(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatRir(rir: number[]): string {
  if (rir.length === 0) return '';
  return rir.every((value) => value === rir[0]) ? `RIR ${rir[0]}` : `RIR ${rir.join('-')}`;
}

const repsRange = (min: number, max: number): string => (min === max ? String(min) : `${min}-${max}`);

export interface Plan {
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  targetRir: number[];
  setStructure?: SetStructure;
  targetReps?: number[];
  backoffRepsMin?: number | null;
  backoffRepsMax?: number | null;
}

function backoffRange(plan: Plan): { min: number; max: number } | null {
  const { backoffRepsMin: min, backoffRepsMax: max } = plan;
  if ((plan.setStructure ?? 'TOP_BACKOFF') !== 'TOP_BACKOFF' || plan.targetSets < 2) return null;
  return min != null && max != null ? { min, max } : null;
}

function repsText(plan: Plan): string {
  const perSet = plan.targetReps ?? [];
  return plan.setStructure === 'PYRAMID' && perSet.length > 0 ? perSet.join('-') : repsRange(plan.targetRepsMin, plan.targetRepsMax);
}

// "3 x 8-12", "3 x 12-10-8" for a pyramid, and "1 x 6-8 and 3 x 8-10" when the back-offs have their own range.
export function prescription(plan: Plan): string {
  const backoff = backoffRange(plan);
  if (backoff) {
    const top = repsRange(plan.targetRepsMin, plan.targetRepsMax);
    const rest = repsRange(backoff.min, backoff.max);
    if (top !== rest) return `1 x ${top} ${t('plan.and')} ${plan.targetSets - 1} x ${rest}`;
  }
  return `${plan.targetSets} x ${repsText(plan)}`;
}

export function planDetail(plan: Plan): string {
  const detail = `${formatRir(plan.targetRir)}, ${formatRest(plan.restSeconds)}`;
  if (plan.setStructure === 'STRAIGHT') return `${t('plan.equalSets')}, ${detail}`;
  if (plan.setStructure === 'PYRAMID') return `${t('plan.pyramidWord')}, ${detail}`;
  return detail;
}

const SET_EXECUTION_SECONDS = 45;

// Rough length of a session: each set takes its execution time plus its rest, rounded to 5 minutes. Warm-up is not counted.
export function estimateMinutes(exercises: Pick<Plan, 'targetSets' | 'restSeconds'>[]): number {
  const seconds = exercises.reduce((total, e) => total + e.targetSets * (SET_EXECUTION_SECONDS + e.restSeconds), 0);
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

export interface PlanAnswers {
  sets: number;
  repsMin: number;
  repsMax: number;
  backoffMin: number;
  backoffMax: number;
  structure: SetStructure;
  pyramidReps: number[];
  topRir: number;
  backoffRir: number;
  // Seconds of rest; null is "Automatic" (the default of each exercise).
  rest: number | null;
}

const RECOMMENDED: Record<Experience, { sets: number; topRir: number; backoffRir: number }> = {
  BEGINNER: { sets: 2, topRir: 2, backoffRir: 3 },
  INTERMEDIATE: { sets: 2, topRir: 1, backoffRir: 2 },
  ADVANCED: { sets: 2, topRir: 0, backoffRir: 2 },
};

export function recommendedAnswers(experience: Experience): PlanAnswers {
  return {
    ...RECOMMENDED[experience],
    repsMin: DEFAULT_TOP_REPS[0],
    repsMax: DEFAULT_TOP_REPS[1],
    backoffMin: DEFAULT_BACKOFF_REPS[0],
    backoffMax: DEFAULT_BACKOFF_REPS[1],
    structure: 'TOP_BACKOFF',
    pyramidReps: [],
    rest: null,
  };
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const hasBackoff = (answers: PlanAnswers): boolean => answers.structure === 'TOP_BACKOFF' && answers.sets >= 2;

// Every setter returns the same object when nothing changes, so a button knows it is at its limit.
export function withSets(answers: PlanAnswers, sets: number): PlanAnswers {
  const next = clamp(sets, answers.structure === 'PYRAMID' ? MIN_PYRAMID_SETS : MIN_SETS, MAX_SETS);
  if (next === answers.sets) return answers;
  if (answers.structure !== 'PYRAMID') return { ...answers, sets: next };
  return { ...answers, sets: next, pyramidReps: spreadReps(next, Math.min(...answers.pyramidReps), Math.max(...answers.pyramidReps)) };
}

export function withStructure(answers: PlanAnswers, structure: SetStructure): PlanAnswers {
  if (structure === answers.structure) return answers;
  const was = answers.structure;
  const span =
    was === 'TOP_BACKOFF'
      ? { min: Math.min(answers.repsMin, answers.backoffMin), max: Math.max(answers.repsMax, answers.backoffMax) }
      : was === 'PYRAMID'
        ? { min: Math.min(...answers.pyramidReps), max: Math.max(...answers.pyramidReps) }
        : { min: answers.repsMin, max: answers.repsMax };
  if (structure === 'PYRAMID') {
    const sets = Math.max(answers.sets, MIN_PYRAMID_SETS);
    return { ...answers, structure, sets, repsMin: span.min, repsMax: span.max, pyramidReps: spreadReps(sets, span.min, span.max) };
  }
  if (structure === 'TOP_BACKOFF') {
    return { ...answers, structure, repsMin: DEFAULT_TOP_REPS[0], repsMax: DEFAULT_TOP_REPS[1], backoffMin: DEFAULT_BACKOFF_REPS[0], backoffMax: DEFAULT_BACKOFF_REPS[1] };
  }
  return { ...answers, structure, repsMin: span.min, repsMax: span.max };
}

export function withRepsPreset(answers: PlanAnswers, preset: readonly [number, number]): PlanAnswers {
  return answers.repsMin === preset[0] && answers.repsMax === preset[1] ? answers : { ...answers, repsMin: preset[0], repsMax: preset[1] };
}

export function withBackoffPreset(answers: PlanAnswers, preset: readonly [number, number]): PlanAnswers {
  return answers.backoffMin === preset[0] && answers.backoffMax === preset[1] ? answers : { ...answers, backoffMin: preset[0], backoffMax: preset[1] };
}

export function withRir(answers: PlanAnswers, which: 'topRir' | 'backoffRir', delta: number): PlanAnswers {
  const value = clamp(answers[which] + delta, 0, MAX_RIR);
  return value === answers[which] ? answers : { ...answers, [which]: value };
}

export function withRest(answers: PlanAnswers, rest: number | null): PlanAnswers {
  return answers.rest === rest ? answers : { ...answers, rest };
}

export const rirList = (answers: PlanAnswers): number[] => buildRir(answers.sets, answers.topRir, answers.backoffRir, answers.structure);

// The plan that comes out of the answers, shaped like an exercise of the template. `autoRest` is used when rest is automatic.
export function answersPlan(answers: PlanAnswers, autoRest: number): Plan {
  const pyramid = answers.structure === 'PYRAMID';
  return {
    targetSets: answers.sets,
    targetRepsMin: pyramid ? Math.min(...answers.pyramidReps) : answers.repsMin,
    targetRepsMax: pyramid ? Math.max(...answers.pyramidReps) : answers.repsMax,
    targetReps: pyramid ? answers.pyramidReps : [],
    backoffRepsMin: hasBackoff(answers) ? answers.backoffMin : null,
    backoffRepsMax: hasBackoff(answers) ? answers.backoffMax : null,
    setStructure: answers.structure,
    targetRir: rirList(answers),
    restSeconds: answers.rest ?? autoRest,
  };
}

export function summaryText(answers: PlanAnswers): string {
  const plan = answersPlan(answers, 0);
  const prefix = { TOP_BACKOFF: '', STRAIGHT: `${t('plan.equalSetsLow')}, `, PYRAMID: `${t('plan.pyramidLow')}, ` }[answers.structure];
  const rest = answers.rest === null ? t('plan.autoRest') : formatRest(answers.rest);
  return `${prescription(plan)}, ${prefix}${formatRir(plan.targetRir)}, ${rest}`;
}
