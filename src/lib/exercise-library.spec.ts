import { describe, expect, it } from 'vitest';
import { buildLibrary, nameOf, type LibraryRow } from './exercise-library';

const rows: LibraryRow[] = [
  { slug: 'leg-press', name: 'Leg Press', equipment: 'leg_press', bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'beginner', primaryMuscles: ['quadriceps'] },
  { slug: 'squat', name: 'Barbell Squat', equipment: 'barbell', bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'intermediate', primaryMuscles: ['quadriceps'] },
];

describe('buildLibrary', () => {
  it('gives every exercise its own id and finds it by slug', () => {
    const library = buildLibrary(rows);
    expect(library.all.map((e) => e.id)).toEqual([1, 2]);
    expect(library.bySlug.get('squat')?.equipment).toBe('barbell');
  });

  it('uses the library name when there is one and a readable slug otherwise', () => {
    const library = buildLibrary(rows);
    expect(nameOf(library, 'squat')).toBe('Barbell Squat');
    expect(nameOf(library, 'incline-db-press')).toBe('Incline dumbbell press');
    expect(nameOf(null, 'leg-press')).toBe('Leg press');
  });
});
