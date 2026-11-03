import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FINAL_WEEK,
  MAX_PRIORITY_MUSCLES,
  WIZARD_STEPS,
  canContinue,
  initialWizard,
  nameError,
  parseWeeks,
  rampWeeks,
  startDateFor,
  stepSteps,
  toggleMuscle,
  toggleDeloadOption,
} from './routine-wizard';

describe('parseWeeks', () => {
  it('accepts whole numbers from 4 to 52 and nothing else', () => {
    expect(parseWeeks('12')).toBe(12);
    expect(parseWeeks(' 4 ')).toBe(4);
    for (const bad of ['', 'abc', '3', '53', '-8', '8.5', '1000']) expect(parseWeeks(bad)).toBeNull();
  });
});

describe('nameError', () => {
  it('asks for 2 to 80 characters, ignoring surrounding spaces', () => {
    expect(nameError('a')).not.toBeNull();
    expect(nameError('   a   ')).not.toBeNull();
    expect(nameError('Push Pull Legs')).toBeNull();
    expect(nameError('x'.repeat(81))).not.toBeNull();
    expect(nameError('x'.repeat(80))).toBeNull();
  });
});

describe('startDateFor', () => {
  const today = '2026-11-03';
  it('resolves today and tomorrow', () => {
    expect(startDateFor('TODAY', today, '')).toBe('2026-11-03');
    expect(startDateFor('TOMORROW', today, '')).toBe('2026-11-04');
  });
  it('rolls over month and year ends', () => {
    expect(startDateFor('TOMORROW', '2026-11-30', '')).toBe('2026-12-01');
    expect(startDateFor('TOMORROW', '2026-12-31', '')).toBe('2027-01-01');
  });
  it('accepts a real custom date from today on and rejects the rest', () => {
    expect(startDateFor('DATE', today, '2026-11-20')).toBe('2026-11-20');
    expect(startDateFor('DATE', today, '2026-11-03')).toBe('2026-11-03');
    for (const bad of ['2026-11-02', '2026-02-30', '2026-11-31', '03/11/2026', '']) expect(startDateFor('DATE', today, bad)).toBeNull();
  });
});

describe('stepSteps', () => {
  it('moves the goal in 500s, aligns odd values and stays within 1,000 to 50,000', () => {
    expect(stepSteps(8000, 1)).toBe(8500);
    expect(stepSteps(8000, -1)).toBe(7500);
    expect(stepSteps(8250, 1)).toBe(8500);
    expect(stepSteps(8250, -1)).toBe(8000);
    expect(stepSteps(1000, -1)).toBe(1000);
    expect(stepSteps(50000, 1)).toBe(50000);
  });
});

describe('rampWeeks', () => {
  it('suggests an increase every N weeks, and the last week does not rise when it is a final week', () => {
    expect(rampWeeks(2, 12, 'NONE')).toEqual([2, 4, 6, 8, 10, 12]);
    expect(rampWeeks(2, 12, 'DELOAD')).toEqual([2, 4, 6, 8, 10]);
    expect(rampWeeks(4, 4, 'DEVOLUME')).toEqual([]);
  });
  it('lets at most two priority muscles be chosen', () => {
    let choice = { enabled: true, muscles: [] as string[], everyWeeks: 2 };
    for (const m of ['chest', 'lats', 'biceps']) choice = toggleMuscle(choice, m);
    expect(choice.muscles).toEqual(['chest', 'lats']);
    expect(MAX_PRIORITY_MUSCLES).toBe(2);
    expect(toggleMuscle(choice, 'chest').muscles).toEqual(['lats']);
  });
});

describe('final week', () => {
  it('a deload must lower something: the last option cannot be switched off', () => {
    const both = { ...DEFAULT_FINAL_WEEK, mode: 'DELOAD' as const };
    const onlySets = toggleDeloadOption(both, 'higherRir');
    expect(onlySets).toMatchObject({ fewerSets: true, higherRir: false });
    expect(toggleDeloadOption(onlySets, 'fewerSets')).toBe(onlySets);
  });
});

describe('the steps', () => {
  it('goes through eight steps in the order of the app', () => {
    expect(WIZARD_STEPS).toEqual(['experience', 'days', 'duration', 'equipment', 'injuries', 'plan', 'preview', 'confirm']);
  });

  it('only lets the person continue when the step is answered: equipment is required, the name must be valid', () => {
    const state = initialWizard();
    expect(canContinue(state, 'experience')).toBe(true);
    expect(canContinue(state, 'equipment')).toBe(false);
    expect(canContinue({ ...state, equipment: 'HOME' }, 'equipment')).toBe(true);
    expect(canContinue({ ...state, name: '' }, 'confirm')).toBe(false);
    expect(canContinue({ ...state, name: 'My routine' }, 'confirm')).toBe(true);
  });
});
