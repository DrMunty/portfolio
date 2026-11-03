// The exercise library the assistant swaps from: the RepDB free dataset trimmed to the fields the fit rules read.
// It is generated at build time (scripts/fetch-exercises.mjs) and loaded only when the person reaches the equipment step.
import type { FitExercise } from './exercise-fit';
import { exerciseLabel } from './routine-assistant';

export interface LibraryRow {
  slug: string;
  name: string;
  equipment: string | null;
  bodyPart: string;
  mechanic: string | null;
  difficulty: string;
  primaryMuscles: string[];
}

export interface Library {
  all: FitExercise[];
  bySlug: Map<string, FitExercise>;
  names: Map<string, string>;
}

export function buildLibrary(rows: LibraryRow[]): Library {
  const all: FitExercise[] = rows.map((row, index) => ({
    id: index + 1,
    slug: row.slug,
    equipment: row.equipment,
    bodyPart: row.bodyPart,
    mechanic: row.mechanic,
    difficulty: row.difficulty,
    primaryMuscles: row.primaryMuscles,
  }));
  return {
    all,
    bySlug: new Map(all.map((e) => [e.slug, e])),
    names: new Map(rows.map((row) => [row.slug, row.name])),
  };
}

export const nameOf = (library: Library | null, slug: string): string => library?.names.get(slug) ?? exerciseLabel(slug);

export async function loadLibrary(): Promise<Library | null> {
  try {
    const module = await import('../generated/exercise-library.json');
    return buildLibrary(module.default as LibraryRow[]);
  } catch {
    return null;
  }
}
