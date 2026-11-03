// The exercise library the assistant swaps from: the RepDB free dataset trimmed to the fields the fit rules read.
// It is generated at build time (scripts/fetch-exercises.mjs) and loaded only when the person reaches the equipment step.
import { getLang } from '../i18n';
import type { FitExercise } from './exercise-fit';
import { exerciseLabel } from './routine-assistant';

export interface LibraryRow {
  slug: string;
  name: string;
  nameEs?: string;
  // Path of the first picture, relative to the RepDB server.
  image?: string | null;
  equipment: string | null;
  bodyPart: string;
  mechanic: string | null;
  difficulty: string;
  primaryMuscles: string[];
}

export interface Library {
  all: FitExercise[];
  bySlug: Map<string, FitExercise>;
  names: Map<string, { en: string; es: string }>;
  images: Map<string, string>;
}

// The pictures stay on RepDB's own server and are only linked, never copied into this repository.
const MEDIA_BASE = 'https://exercise-dataset.com/';

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
    names: new Map(rows.map((row) => [row.slug, { en: row.name, es: row.nameEs ?? row.name }])),
    images: new Map(rows.flatMap((row) => (row.image ? [[row.slug, row.image] as [string, string]] : []))),
  };
}

export const nameOf = (library: Library | null, slug: string): string => library?.names.get(slug)?.[getLang()] ?? exerciseLabel(slug);

export function imageOf(library: Library | null, slug: string): string | null {
  const path = library?.images.get(slug);
  return path ? MEDIA_BASE + path : null;
}

export async function loadLibrary(): Promise<Library | null> {
  try {
    const module = await import('../generated/exercise-library.json');
    return buildLibrary(module.default as LibraryRow[]);
  } catch {
    return null;
  }
}
