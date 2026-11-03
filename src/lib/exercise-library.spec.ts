import { describe, expect, it } from 'vitest';
import { buildLibrary, imageOf, nameOf, type LibraryRow } from './exercise-library';

const rows: LibraryRow[] = [
  { slug: 'leg-press', name: 'Leg Press', equipment: 'leg_press', bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'beginner', primaryMuscles: ['quadriceps'] },
  { slug: 'squat', name: 'Barbell Squat', equipment: 'barbell', bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'intermediate', primaryMuscles: ['quadriceps'] },
];

describe('imageOf', () => {
  const library = buildLibrary([
    { slug: 'leg-press', name: 'Leg Press', image: 'images/flat/leg-press-start.webp', equipment: null, bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'beginner', primaryMuscles: [] },
    { slug: 'squat', name: 'Squat', equipment: null, bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'beginner', primaryMuscles: [] },
  ]);

  it('points at the picture on the RepDB server, which is where the dataset publishes them', () => {
    expect(imageOf(library, 'leg-press')).toBe('https://exercise-dataset.com/images/flat/leg-press-start.webp');
  });

  it('gives nothing when the exercise has no picture or is not in the library', () => {
    expect(imageOf(library, 'squat')).toBeNull();
    expect(imageOf(library, 'nope')).toBeNull();
    expect(imageOf(null, 'leg-press')).toBeNull();
  });
});

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
