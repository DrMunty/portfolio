// Downloads the RepDB free-tier exercise dataset and keeps only the fields the routine assistant needs.
// RepDB's licence forbids republishing the dataset (or a derived one) in a repository, so the result goes to
// src/generated/, which git ignores, and it is produced again on every deploy. Attribution: "Exercise data by RepDB (repdb.co)".
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_DATASET = 'https://exercise-dataset.com/exercises.json';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/generated/exercise-library.json');

if (existsSync(out) && JSON.parse(readFileSync(out, 'utf8')).length > 0) {
  console.log('exercise library already generated');
  process.exit(0);
}

const response = await fetch(URL_DATASET);
if (!response.ok) {
  console.error(`Could not download the exercise library (${response.status}). Run "npm run data" again when it is reachable.`);
  process.exit(1);
}
const { exercises } = await response.json();
if (!Array.isArray(exercises) || exercises.length === 0) {
  console.error('The exercise dataset has an unexpected shape.');
  process.exit(1);
}

const library = exercises.map((e) => ({
  slug: e.id,
  name: e.name_en,
  equipment: e.equipment ?? null,
  bodyPart: e.body_part,
  mechanic: e.mechanic ?? null,
  difficulty: e.difficulty,
  primaryMuscles: e.primary_muscles ?? [],
}));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(library));
console.log(`exercise library written: ${library.length} exercises`);
