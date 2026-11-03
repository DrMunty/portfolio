import { describe, expect, it } from 'vitest';
import {
  buildWeek,
  dayOptions,
  exerciseLabel,
  recommendedDays,
  sessionSets,
  weekSets,
} from './routine-assistant';
import { SESSIONS, TEMPLATES } from './routine-templates';

const options = dayOptions(TEMPLATES);

describe('dayOptions', () => {
  it('groups the templates by days per week, from fewest to most days', () => {
    expect(options.map((o) => o.daysPerWeek)).toEqual([1, 2, 3, 4, 5]);
    expect(dayOptions([...TEMPLATES].reverse()).map((o) => o.daysPerWeek)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps both ways of training five days as two templates', () => {
    expect(options.find((o) => o.daysPerWeek === 5)?.templates).toHaveLength(2);
  });
});

describe('recommendedDays', () => {
  it('recommends 3 days to a beginner, 4 to an intermediate and 5 to an advanced lifter', () => {
    expect(recommendedDays(options, 'BEGINNER')).toBe(3);
    expect(recommendedDays(options, 'INTERMEDIATE')).toBe(4);
    expect(recommendedDays(options, 'ADVANCED')).toBe(5);
  });

  it('recommends nothing before an experience is chosen', () => {
    expect(recommendedDays(options, null)).toBeNull();
  });

  it('recommends nothing when there is no option with the wanted days', () => {
    const without4 = options.filter((o) => o.daysPerWeek !== 4);
    expect(recommendedDays(without4, 'INTERMEDIATE')).toBeNull();
  });
});

describe('buildWeek', () => {
  it('always has seven days, and every template trains exactly its days per week', () => {
    for (const template of TEMPLATES) {
      const week = buildWeek(template);
      expect(week).toHaveLength(7);
      expect(week.filter((d) => d.session).length).toBe(template.daysPerWeek);
    }
  });

  it('leaves the rest days without a session and numbers the days from 1', () => {
    const week = buildWeek(TEMPLATES.find((t) => t.key === 'FULL_BODY_3')!);
    expect(week.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(week[1].session).toBeNull();
    expect(week.map((d) => d.session?.name ?? null)).toEqual([
      'Full Body A', null, 'Full Body B', null, 'Full Body C', null, null,
    ]);
  });

  it('only refers to sessions that exist', () => {
    for (const template of TEMPLATES) {
      for (const key of template.cycle) {
        expect(key === 'REST' || key in SESSIONS).toBe(true);
      }
    }
  });
});

describe('sets', () => {
  it('adds up the sets of a session and of a whole week', () => {
    expect(sessionSets(SESSIONS['FB_C'])).toBe(19);
    const week = buildWeek(TEMPLATES.find((t) => t.key === 'FULL_BODY_3')!);
    expect(weekSets(week)).toBe(18 + 18 + 19);
  });
});

describe('exerciseLabel', () => {
  it('turns a slug into a readable name and spells out db as dumbbell', () => {
    expect(exerciseLabel('leg-press')).toBe('Leg press');
    expect(exerciseLabel('incline-db-press')).toBe('Incline dumbbell press');
    expect(exerciseLabel('db-shrug')).toBe('Dumbbell shrug');
  });
});
