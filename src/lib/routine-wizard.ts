// The flow of the Fittë routine assistant: its eight steps, what each one needs before the person can continue, and the
// small pure rules of the steps (duration, name, start date, steps goal, volume ramp and final week).
import { getLang, t } from '../i18n';
import type { Area, AreaMode, EquipmentPreference } from './exercise-fit';
import { recommendedAnswers, type PlanAnswers } from './plan-answers';
import type { MessageKey } from '../i18n/messages';
import type { Experience } from './routine-assistant';

export const WIZARD_STEPS = ['experience', 'days', 'duration', 'equipment', 'injuries', 'plan', 'preview', 'confirm'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export const stepTitle = (step: WizardStep): string => t(`step.${step}`);

// ---------- Duration ----------
export const DEFAULT_WEEKS = 12;
export const MIN_WEEKS = 4;
export const MAX_WEEKS = 52;
export const WEEK_PRESETS: readonly number[] = [4, 6, 8, 12, 16];

export function parseWeeks(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const weeks = Number(trimmed);
  return weeks >= MIN_WEEKS && weeks <= MAX_WEEKS ? weeks : null;
}

// ---------- Name and start date ----------
export const NAME_MIN = 2;
export const NAME_MAX = 80;

export function nameError(name: string): string | null {
  const length = name.trim().length;
  if (length < NAME_MIN) return t('err.nameShort', { n: NAME_MIN });
  if (length > NAME_MAX) return t('err.nameLong', { n: NAME_MAX });
  return null;
}

export type StartChoice = 'TODAY' | 'TOMORROW' | 'DATE';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function startDateFor(choice: StartChoice, today: string, custom: string): string | null {
  if (choice === 'TODAY') return today;
  if (choice === 'TOMORROW') return addDays(today, 1);
  if (!DATE_ONLY.test(custom)) return null;
  if (addDays(custom, 0) !== custom) return null;
  return custom >= today ? custom : null;
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// ---------- Daily steps goal ----------
export const MIN_DAILY_STEPS = 1000;
export const MAX_DAILY_STEPS = 50000;
export const DEFAULT_TRAINING_DAY_STEPS = 8000;
export const DEFAULT_REST_DAY_STEPS = 10000;
const STEPS_INCREMENT = 500;

export function stepSteps(steps: number, direction: 1 | -1): number {
  const next = direction === 1 ? (Math.floor(steps / STEPS_INCREMENT) + 1) * STEPS_INCREMENT : (Math.ceil(steps / STEPS_INCREMENT) - 1) * STEPS_INCREMENT;
  return Math.min(MAX_DAILY_STEPS, Math.max(MIN_DAILY_STEPS, next));
}

export const formatSteps = (steps: number): string => String(Math.round(steps)).replace(/\B(?=(\d{3})+(?!\d))/g, getLang() === 'es' ? '.' : ',');

// ---------- Final week and volume ramp ----------
export type FinalWeekMode = 'NONE' | 'DEVOLUME' | 'DELOAD';

export interface FinalWeekChoice {
  mode: FinalWeekMode;
  fewerSets: boolean;
  higherRir: boolean;
}

export const DEFAULT_FINAL_WEEK: FinalWeekChoice = { mode: 'NONE', fewerSets: true, higherRir: true };
export const MIN_WEEKS_FOR_FINAL_WEEK = 2;

export function toggleDeloadOption(choice: FinalWeekChoice, option: 'fewerSets' | 'higherRir'): FinalWeekChoice {
  const other = option === 'fewerSets' ? choice.higherRir : choice.fewerSets;
  if (choice[option] && !other) return choice;
  return { ...choice, [option]: !choice[option] };
}

export function finalWeekHint(choice: FinalWeekChoice): string {
  if (choice.mode === 'DEVOLUME') return t('fw.devolume');
  if (choice.mode === 'DELOAD') {
    if (choice.fewerSets && choice.higherRir) return t('fw.deloadBoth');
    return choice.fewerSets ? t('fw.deloadSets') : t('fw.deloadRir');
  }
  return '';
}

export const MAX_PRIORITY_MUSCLES = 2;
export const RAMP_FREQUENCIES: readonly number[] = [2, 3, 4];

export interface RampChoice {
  enabled: boolean;
  muscles: string[];
  everyWeeks: number;
}

export const DEFAULT_RAMP: RampChoice = { enabled: false, muscles: [], everyWeeks: 2 };

export function toggleMuscle(choice: RampChoice, muscle: string): RampChoice {
  if (choice.muscles.includes(muscle)) return { ...choice, muscles: choice.muscles.filter((m) => m !== muscle) };
  if (choice.muscles.length >= MAX_PRIORITY_MUSCLES) return choice;
  return { ...choice, muscles: [...choice.muscles, muscle] };
}

// The weeks where an increase is suggested: the multiples of the frequency. With a final week, the last week does not rise.
export function rampWeeks(everyWeeks: number, totalWeeks: number, finalWeek: FinalWeekMode): number[] {
  const last = finalWeek === 'NONE' ? totalWeeks : totalWeeks - 1;
  const weeks: number[] = [];
  for (let week = everyWeeks; week <= last; week += everyWeeks) weeks.push(week);
  return weeks;
}

export const MUSCLES = ['chest', 'lats', 'upperBack', 'lowerBack', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'] as const;

export const muscleLabel = (key: string): string => t(`muscle.${key}` as MessageKey);

// ---------- The state of the wizard ----------
export interface WizardState {
  experience: Experience;
  days: number;
  variant: number;
  weeks: number;
  equipment: EquipmentPreference | null;
  areas: Partial<Record<Area, AreaMode>>;
  answers: PlanAnswers;
  // A swap chosen by hand in the preview: slot key (day:slug) to the slug of the replacement.
  picks: Record<string, string>;
  name: string;
  start: StartChoice;
  customDate: string;
  trainingSteps: number;
  restSteps: number;
  ramp: RampChoice;
  finalWeek: FinalWeekChoice;
}

export function initialWizard(): WizardState {
  return {
    experience: 'INTERMEDIATE',
    days: 4,
    variant: 0,
    weeks: DEFAULT_WEEKS,
    equipment: null,
    areas: {},
    answers: recommendedAnswers('INTERMEDIATE'),
    picks: {},
    name: '',
    start: 'TODAY',
    customDate: '',
    trainingSteps: DEFAULT_TRAINING_DAY_STEPS,
    restSteps: DEFAULT_REST_DAY_STEPS,
    ramp: DEFAULT_RAMP,
    finalWeek: DEFAULT_FINAL_WEEK,
  };
}

// Equipment is required (nothing comes marked); the name and a custom start date must be valid. Everything else has a default.
export function canContinue(state: WizardState, step: WizardStep, today: string = todayIso()): boolean {
  switch (step) {
    case 'equipment':
      return state.equipment !== null;
    case 'confirm':
      return nameError(state.name) === null && startDateFor(state.start, today, state.customDate) !== null;
    default:
      return true;
  }
}
