import { describe, expect, it } from 'vitest';
import { progressionStep, readNumber, suggestSets, type LoggedSet } from './suggest-sets';

const working = (weight: number, reps: number): LoggedSet => ({ type: 'WORKING', weight, reps });
const backoff = (weight: number, reps: number): LoggedSet => ({ type: 'BACKOFF', weight, reps });

describe('progressionStep', () => {
  it('is 2.5 kg for total loads and 1.25 kg per side for plates', () => {
    expect(progressionStep('TOTAL')).toBe(2.5);
    expect(progressionStep('PER_SIDE')).toBe(1.25);
  });
});

describe('suggestSets', () => {
  it('raises a set that reaches the top of the range by one step', () => {
    const [s] = suggestSets([working(60, 12)], 12, 'TOTAL');
    expect(s.suggestedWeight).toBe(62.5);
    expect(s.reason).toBe('INCREASE');
  });

  it('counts reps above the top of the range as reaching it', () => {
    expect(suggestSets([working(60, 14)], 12, 'TOTAL')[0].reason).toBe('INCREASE');
  });

  it('repeats the weight of a set that falls short', () => {
    const [s] = suggestSets([working(60, 11)], 12, 'TOTAL');
    expect(s.suggestedWeight).toBe(60);
    expect(s.reason).toBe('MAINTAIN');
  });

  it('uses the plate step for per-side loads and keeps two decimals', () => {
    const [s] = suggestSets([backoff(55, 10)], 10, 'PER_SIDE');
    expect(s.suggestedWeight).toBe(56.25);
  });

  it('decides each set on its own: a back-off can rise while the top set holds', () => {
    const result = suggestSets([working(60, 8), backoff(55, 10)], 10, 'PER_SIDE');
    expect(result.map((s) => s.reason)).toEqual(['MAINTAIN', 'INCREASE']);
    expect(result.map((s) => s.suggestedWeight)).toEqual([60, 56.25]);
  });

  it('takes one cap per set in a pyramid and reuses the last cap for extra sets', () => {
    const sets = [working(40, 12), working(50, 10), working(60, 8), working(60, 8)];
    const result = suggestSets(sets, [12, 10, 8], 'TOTAL');
    expect(result.map((s) => s.reason)).toEqual(['INCREASE', 'INCREASE', 'INCREASE', 'INCREASE']);
    expect(suggestSets([working(60, 7), working(60, 7)], [12, 8], 'TOTAL').map((s) => s.reason)).toEqual([
      'MAINTAIN',
      'MAINTAIN',
    ]);
  });

  it('numbers the sets from 1 and echoes the last session', () => {
    const [a, b] = suggestSets([working(60, 12), backoff(50, 9)], 12, 'TOTAL');
    expect([a.order, b.order]).toEqual([1, 2]);
    expect([b.lastWeight, b.lastReps]).toEqual([50, 9]);
  });
});

describe('readNumber', () => {
  it('turns empty, invalid or negative input into 0 so the demo never shows NaN', () => {
    expect(readNumber('')).toBe(0);
    expect(readNumber('abc')).toBe(0);
    expect(readNumber('-5')).toBe(0);
  });

  it('reads decimals with a dot or a comma', () => {
    expect(readNumber('62.5')).toBe(62.5);
    expect(readNumber('62,5')).toBe(62.5);
  });
});
