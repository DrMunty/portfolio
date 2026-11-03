import { describe, expect, it } from 'vitest';
import { adjustDays, equipmentAllowed, loadedAreas, rankedCandidates, type FitExercise } from './exercise-fit';

const ex = (id: number, slug: string, extra: Partial<FitExercise> = {}): FitExercise => ({
  id,
  slug,
  equipment: null,
  bodyPart: 'upper_legs',
  mechanic: 'compound',
  difficulty: 'intermediate',
  primaryMuscles: ['quadriceps'],
  ...extra,
});

describe('loadedAreas', () => {
  it('flags the areas an exercise usually loads, from its slug', () => {
    expect(loadedAreas('squat')).toEqual(['KNEE', 'LOWER_BACK', 'HIP']);
    expect(loadedAreas('lat-pulldown')).toEqual([]);
    expect(loadedAreas('skull-crusher')).toEqual(['ELBOW']);
  });

  it('lets an exception win over a match', () => {
    expect(loadedAreas('machine-calf-raise')).toEqual([]);
    expect(loadedAreas('standing-calf-raise-squat-machine')).toEqual([]);
  });

  it('returns a copy, so sorting it never changes the next answer', () => {
    loadedAreas('squat').reverse();
    expect(loadedAreas('squat')).toEqual(['KNEE', 'LOWER_BACK', 'HIP']);
  });
});

describe('equipmentAllowed', () => {
  it('allows everything in a full gym', () => {
    for (const e of ['barbell', 'cable', 'leg_press', 'smith_machine', null]) expect(equipmentAllowed('FULL_GYM', e)).toBe(true);
  });

  it('free weights: bars, dumbbells and bodyweight, no machines or cables', () => {
    expect(equipmentAllowed('FREE_WEIGHTS', 'barbell')).toBe(true);
    expect(equipmentAllowed('FREE_WEIGHTS', 'dumbbell')).toBe(true);
    expect(equipmentAllowed('FREE_WEIGHTS', 'pull_up_bar')).toBe(true);
    expect(equipmentAllowed('FREE_WEIGHTS', 'cable')).toBe(false);
    expect(equipmentAllowed('FREE_WEIGHTS', 'leg_press')).toBe(false);
  });

  it('machines: machines, cables and bodyweight, no bars or dumbbells', () => {
    expect(equipmentAllowed('MACHINES', 'cable')).toBe(true);
    expect(equipmentAllowed('MACHINES', 'chest_press_machine')).toBe(true);
    expect(equipmentAllowed('MACHINES', 'barbell')).toBe(false);
    expect(equipmentAllowed('MACHINES', 'dumbbell')).toBe(false);
  });

  it('home: bodyweight, bands, dumbbells and kettlebells, no bars, cables or machines', () => {
    for (const e of ['dumbbell', 'kettlebell', 'resistance_band', 'pull_up_bar', null]) expect(equipmentAllowed('HOME', e)).toBe(true);
    for (const e of ['barbell', 'cable', 'leg_press', 'smith_machine']) expect(equipmentAllowed('HOME', e)).toBe(false);
  });
});

describe('adjustDays', () => {
  const squat = ex(1, 'squat', { equipment: 'barbell' });
  const legPress = ex(2, 'leg-press', { equipment: 'leg_press' });
  const tke = ex(3, 'banded-terminal-knee-extension', { equipment: 'loop_band', mechanic: 'isolation' });
  const stepDown = ex(4, 'slow-eccentric-box-lower', { equipment: 'dumbbell' });
  const library = [squat, legPress, tke, stepDown];
  const days = [{ order: 1, exercises: [squat] }];

  it('changes nothing with a full gym and no complaints', () => {
    expect(adjustDays({ days, library, equipment: 'FULL_GYM', areas: [] })).toEqual({ swaps: [], gradual: [], unresolved: [] });
  });

  it('avoiding the knee swaps the squat for a similar exercise that does not load it', () => {
    const result = adjustDays({ days, library, equipment: 'FULL_GYM', areas: [{ area: 'KNEE', mode: 'AVOID' }] });
    expect(result.swaps).toHaveLength(1);
    expect(result.swaps[0]).toMatchObject({ dayOrder: 1, exerciseId: 1, reasons: ['KNEE'] });
    expect([3, 4]).toContain(result.swaps[0].replacementId);
  });

  it('never picks a substitute that is already in the day', () => {
    const result = adjustDays({ days: [{ order: 1, exercises: [squat, tke] }], library, equipment: 'FULL_GYM', areas: [{ area: 'KNEE', mode: 'AVOID' }] });
    expect(result.swaps[0].replacementId).toBe(4);
  });

  it('swaps what the equipment cannot do, with its reason', () => {
    const bench = ex(10, 'bench-press', { equipment: 'barbell', bodyPart: 'chest', primaryMuscles: ['pectoralis_major'] });
    const machine = ex(11, 'chest-press-machine', { equipment: 'chest_press_machine', bodyPart: 'chest', primaryMuscles: ['pectoralis_major'] });
    const result = adjustDays({ days: [{ order: 1, exercises: [bench] }], library: [bench, machine], equipment: 'MACHINES', areas: [] });
    expect(result.swaps).toEqual([{ dayOrder: 1, exerciseId: 10, replacementId: 11, reasons: ['EQUIPMENT'] }]);
  });

  it('lists the area reason before the equipment reason', () => {
    const ohp = ex(20, 'ohp', { equipment: 'barbell', bodyPart: 'shoulders', primaryMuscles: ['anterior_deltoid'] });
    const lateral = ex(21, 'cable-lateral-raise', { equipment: 'cable', bodyPart: 'shoulders', mechanic: 'isolation', primaryMuscles: ['anterior_deltoid'] });
    const result = adjustDays({ days: [{ order: 1, exercises: [ohp] }], library: [ohp, lateral], equipment: 'MACHINES', areas: [{ area: 'SHOULDER', mode: 'AVOID' }] });
    expect(result.swaps[0].reasons).toEqual(['SHOULDER', 'EQUIPMENT']);
  });

  it('"carry on carefully" keeps the exercise and only flags it', () => {
    const result = adjustDays({ days, library, equipment: 'FULL_GYM', areas: [{ area: 'KNEE', mode: 'GRADUAL' }] });
    expect(result.swaps).toEqual([]);
    expect(result.gradual).toEqual([{ dayOrder: 1, exerciseId: 1, areas: ['KNEE'] }]);
  });

  it('keeps the exercise and reports it when there is no similar substitute', () => {
    const result = adjustDays({ days, library: [squat], equipment: 'FULL_GYM', areas: [{ area: 'KNEE', mode: 'AVOID' }] });
    expect(result.swaps).toEqual([]);
    expect(result.unresolved).toEqual([{ dayOrder: 1, exerciseId: 1, reasons: ['KNEE'] }]);
  });

  it('does not give two slots of the same day the same substitute', () => {
    const squat2 = ex(5, 'front-squat', { equipment: 'barbell' });
    const result = adjustDays({ days: [{ order: 1, exercises: [squat, squat2] }], library: [squat, squat2, tke, stepDown], equipment: 'FULL_GYM', areas: [{ area: 'KNEE', mode: 'AVOID' }] });
    const ids = result.swaps.map((s) => s.replacementId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('rankedCandidates', () => {
  const original = ex(1, 'squat', { equipment: 'barbell', mechanic: 'compound' });
  const options = { equipment: 'FULL_GYM' as const, avoid: [], taken: new Set<number>([1]) };

  it('only offers exercises of the same body part that share a main muscle, and with a movement type', () => {
    const sameMuscle = ex(2, 'leg-curl-like', { mechanic: 'isolation' });
    const otherPart = ex(3, 'row', { bodyPart: 'back', primaryMuscles: ['lats'] });
    const noMechanic = ex(4, 'stretch', { mechanic: null });
    expect(rankedCandidates(original, [original, sameMuscle, otherPart, noMechanic], options).map((e) => e.id)).toEqual([2]);
  });

  it('breaks ties by id so the order never changes', () => {
    const a = ex(5, 'a', { equipment: 'dumbbell' });
    const b = ex(3, 'b', { equipment: 'dumbbell' });
    expect(rankedCandidates(original, [a, b], options).map((e) => e.id)).toEqual([3, 5]);
  });

  it('prefers the same movement type and equipment class, and is deterministic', () => {
    const near = ex(2, 'a', { equipment: 'dumbbell', mechanic: 'compound' });
    const far = ex(3, 'b', { equipment: 'cable', mechanic: 'isolation' });
    expect(rankedCandidates(original, [far, near], options).map((e) => e.id)).toEqual([2, 3]);
    expect(rankedCandidates(original, [near, far], options).map((e) => e.id)).toEqual([2, 3]);
  });
});
