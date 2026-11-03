// The choices of the Fittë routine assistant, as pure functions: experience, days per week and the week that results.
import { getLang } from '../i18n';
import { REST, SESSIONS, TEMPLATES, type Session, type Template, type TemplateExercise } from './routine-templates';

export type Experience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const EXPERIENCES: readonly Experience[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export const sessionName = (session: Session): string => (getLang() === 'es' && session.nameEs ? session.nameEs : session.name);

// Someone who starts adapts better to a few full body days; with more years, more volume spread over more days.
const RECOMMENDED_DAYS: Record<Experience, number> = { BEGINNER: 3, INTERMEDIATE: 4, ADVANCED: 5 };

export interface DayOption {
  daysPerWeek: number;
  templates: Template[];
}

export function dayOptions(templates: Template[] = TEMPLATES): DayOption[] {
  const byDays = new Map<number, Template[]>();
  for (const template of templates) {
    byDays.set(template.daysPerWeek, [...(byDays.get(template.daysPerWeek) ?? []), template]);
  }
  return [...byDays.entries()].sort(([a], [b]) => a - b).map(([daysPerWeek, list]) => ({ daysPerWeek, templates: list }));
}

export function recommendedDays(options: DayOption[], experience: Experience | null): number | null {
  if (!experience) return null;
  const wanted = RECOMMENDED_DAYS[experience];
  return options.some((option) => option.daysPerWeek === wanted) ? wanted : null;
}

export interface WeekDay {
  day: number;
  session: Session | null;
}

export function buildWeek(template: Template, sessions: Record<string, Session> = SESSIONS): WeekDay[] {
  return template.cycle.map((key, index) => ({ day: index + 1, session: key === REST ? null : sessions[key] }));
}

export const sessionSets = (session: Session): number => session.exercises.reduce((sum, e) => sum + e.sets, 0);

export const weekSets = (week: WeekDay[]): number => week.reduce((sum, d) => sum + (d.session ? sessionSets(d.session) : 0), 0);

export function exerciseLabel(slug: string): string {
  const words = slug.split('-').map((w) => (w === 'db' ? 'dumbbell' : w));
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const repsLabel = (e: TemplateExercise): string => (e.repsMin === e.repsMax ? `${e.repsMin}` : `${e.repsMin}-${e.repsMax}`);
