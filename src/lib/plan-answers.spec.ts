import { describe, expect, it } from 'vitest';
import {
  answersPlan,
  buildRir,
  estimateMinutes,
  formatRest,
  hasBackoff,
  planDetail,
  prescription,
  recommendedAnswers,
  spreadReps,
  summaryText,
  withRest,
  withRir,
  withSets,
  withStructure,
} from './plan-answers';

describe('buildRir', () => {
  it('top set + back-offs: the top RIR on the first set, the back-off RIR on the rest', () => {
    expect(buildRir(3, 1, 2, 'TOP_BACKOFF')).toEqual([1, 2, 2]);
  });
  it('equal sets: the same RIR on all of them', () => {
    expect(buildRir(3, 2, 3, 'STRAIGHT')).toEqual([2, 2, 2]);
  });
  it('pyramid: the top RIR on the last, heaviest set', () => {
    expect(buildRir(3, 1, 2, 'PYRAMID')).toEqual([2, 2, 1]);
  });
});

describe('spreadReps', () => {
  it('spreads the range evenly from most to fewest reps', () => {
    expect(spreadReps(3, 8, 12)).toEqual([12, 10, 8]);
    expect(spreadReps(1, 8, 12)).toEqual([12]);
    // 10.5 rounds up to 11
    expect(spreadReps(3, 8, 13)).toEqual([13, 11, 8]);
  });
});

describe('recommendedAnswers', () => {
  it('uses one top set and one back-off at every level, with less margin the more experience', () => {
    const [b, i, a] = (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(recommendedAnswers);
    expect([b.topRir, i.topRir, a.topRir]).toEqual([2, 1, 0]);
    expect([b.backoffRir, i.backoffRir, a.backoffRir]).toEqual([3, 2, 2]);
    expect([b.sets, i.sets, a.sets]).toEqual([2, 2, 2]);
    expect([i.repsMin, i.repsMax, i.backoffMin, i.backoffMax]).toEqual([6, 8, 8, 10]);
  });
});

describe('changing the answers', () => {
  const base = recommendedAnswers('INTERMEDIATE');

  it('returns the same object when nothing changes, so a button knows it is at its limit', () => {
    expect(withSets(base, 2)).toBe(base);
    expect(withRir(base, 'topRir', -1 + 1)).toBe(base);
    expect(withRir({ ...base, topRir: 0 }, 'topRir', -1)).toEqual({ ...base, topRir: 0 });
  });

  it('keeps sets between 1 and 30 and RIR between 0 and 5', () => {
    expect(withSets(base, 99).sets).toBe(30);
    expect(withSets(base, 0).sets).toBe(1);
    expect(withRir({ ...base, topRir: 5 }, 'topRir', 1).topRir).toBe(5);
  });

  it('a pyramid needs at least two sets and spreads the reps again when the sets change', () => {
    const pyramid = withStructure(base, 'PYRAMID');
    expect(pyramid.pyramidReps.length).toBe(pyramid.sets);
    const four = withSets({ ...pyramid, repsMin: 8, repsMax: 12, pyramidReps: spreadReps(3, 8, 12) }, 4);
    expect(four.pyramidReps).toEqual(spreadReps(4, 8, 12));
    expect(withSets(pyramid, 1).sets).toBe(2);
  });

  it('going back to top set + back-offs restores the default ranges', () => {
    const straight = withStructure(base, 'STRAIGHT');
    expect(withStructure(straight, 'TOP_BACKOFF')).toMatchObject({ repsMin: 6, repsMax: 8, backoffMin: 8, backoffMax: 10 });
  });

  it('leaving top set + back-offs keeps the range both sets cover', () => {
    expect(withStructure(base, 'STRAIGHT')).toMatchObject({ repsMin: 6, repsMax: 10 });
  });

  it('back-offs only exist with top set + back-offs and at least two sets', () => {
    expect(hasBackoff(base)).toBe(true);
    expect(hasBackoff(withSets(base, 1))).toBe(false);
    expect(hasBackoff(withStructure(base, 'STRAIGHT'))).toBe(false);
  });

  it('automatic rest is null and a preset replaces it', () => {
    expect(base.rest).toBeNull();
    expect(withRest(base, 120).rest).toBe(120);
  });
});

describe('what the plan looks like', () => {
  const base = recommendedAnswers('INTERMEDIATE');

  it('writes the prescription with a range per kind of set', () => {
    expect(prescription(answersPlan(base, 120))).toBe('1 x 6-8 and 1 x 8-10');
    expect(prescription(answersPlan(withStructure(base, 'STRAIGHT'), 120))).toBe('2 x 6-10');
  });

  it('writes a pyramid with the reps of each set', () => {
    const pyramid = withSets(withStructure(base, 'PYRAMID'), 3);
    expect(prescription(answersPlan(pyramid, 120))).toMatch(/^3 x \d+-\d+-\d+$/);
  });

  it('says the structure and RIR in the detail line', () => {
    // With equal sets every set uses the top-set RIR (1 for an intermediate), as in the app.
    expect(planDetail(answersPlan(withStructure(base, 'STRAIGHT'), 120))).toBe('Equal sets, RIR 1, 2:00');
    expect(planDetail(answersPlan(base, 90))).toBe('RIR 1-2, 1:30');
  });

  it('summarises everything in one line', () => {
    expect(summaryText(base)).toBe('1 x 6-8 and 1 x 8-10, RIR 1-2, automatic rest');
  });

  it('formats rest as minutes and seconds', () => {
    expect([formatRest(120), formatRest(90), formatRest(45)]).toEqual(['2:00', '1:30', '0:45']);
  });

  it('estimates a session to the nearest five minutes, never less than five', () => {
    // 3 x (45 + 120) + 3 x (45 + 90) = 900 seconds = 15 minutes
    expect(estimateMinutes([{ targetSets: 3, restSeconds: 120 }, { targetSets: 3, restSeconds: 90 }])).toBe(15);
    expect(estimateMinutes([])).toBe(5);
    // 7 x (45 + 60) = 735 seconds = 12.25 minutes, which rounds to 10
    expect(estimateMinutes([{ targetSets: 7, restSeconds: 60 }])).toBe(10);
  });
});
