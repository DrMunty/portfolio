// Port of the double-progression rule from the Fittë API (exercises/progression.ts), comments removed.
export type LoadType = 'PER_SIDE' | 'TOTAL';
export type SetKind = 'WORKING' | 'BACKOFF';
export type SuggestionReason = 'INCREASE' | 'MAINTAIN';

export interface LoggedSet {
  type: SetKind;
  weight: number;
  reps: number;
}

export interface SetSuggestion {
  order: number;
  type: SetKind;
  lastWeight: number;
  lastReps: number;
  suggestedWeight: number;
  reason: SuggestionReason;
}

const PROGRESSION_STEP_KG = { PER_SIDE: 1.25, TOTAL: 2.5 } as const;

const round2 = (value: number): number => Math.round(value * 100) / 100;

export function progressionStep(loadType: LoadType): number {
  return PROGRESSION_STEP_KG[loadType];
}

function capAt(targetRepsMax: number | number[], index: number): number {
  return Array.isArray(targetRepsMax)
    ? targetRepsMax[Math.min(index, targetRepsMax.length - 1)]
    : targetRepsMax;
}

export function suggestSets(
  sets: LoggedSet[],
  targetRepsMax: number | number[],
  loadType: LoadType,
): SetSuggestion[] {
  const step = progressionStep(loadType);

  return sets.map((set, index) => {
    const reachedMax = set.reps >= capAt(targetRepsMax, index);
    return {
      order: index + 1,
      type: set.type,
      lastWeight: set.weight,
      lastReps: set.reps,
      suggestedWeight: reachedMax ? round2(set.weight + step) : set.weight,
      reason: reachedMax ? 'INCREASE' : 'MAINTAIN',
    };
  });
}

// Demo input: anything that is not a positive number reads as 0, and a comma counts as a decimal point.
export function readNumber(raw: string): number {
  const value = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}
