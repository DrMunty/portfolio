import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { detectLang, setLang, t } from './index';
import { en, es } from './messages';
import { formatSteps, finalWeekHint, nameError } from '../lib/routine-wizard';
import { answersPlan, planDetail, prescription, recommendedAnswers, summaryText, withStructure } from '../lib/plan-answers';
import { buildLibrary, nameOf } from '../lib/exercise-library';
import { SESSIONS } from '../lib/routine-templates';
import { sessionName } from '../lib/routine-assistant';

afterEach(() => setLang('en', false));

describe('the dictionaries', () => {
  it('have the same keys, so nothing is left untranslated', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('keep the same {placeholders} in both languages', () => {
    const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join();
    for (const key of Object.keys(en) as (keyof typeof en)[]) expect(holes(es[key]), key).toBe(holes(en[key]));
  });
});

describe('index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

  it('only asks for translations that exist', () => {
    const keys = new Set<string>();
    for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) keys.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(';')) keys.add(pair.split(':')[1]);
    expect(keys.size).toBeGreaterThan(40);
    for (const key of keys) expect(Object.keys(en), key).toContain(key);
  });
});

describe('t', () => {
  it('fills in the values and leaves unknown placeholders alone', () => {
    expect(t('days.note', { level: 'beginner', days: 3 })).toBe('Recommended for beginner: 3 days.');
    expect(t('days.note', { level: 'beginner' })).toBe('Recommended for beginner: {days} days.');
  });

  it('speaks Spanish after switching and back', () => {
    setLang('es', false);
    expect(t('as.next')).toBe('Siguiente');
    setLang('en', false);
    expect(t('as.next')).toBe('Next');
  });
});

describe('detectLang', () => {
  it('the URL wins over the stored choice, which wins over the browser', () => {
    expect(detectLang('?lang=es', 'en', ['en-US'])).toBe('es');
    expect(detectLang('', 'es', ['en-US'])).toBe('es');
    expect(detectLang('', null, ['es-ES', 'en'])).toBe('es');
    expect(detectLang('', null, ['en-GB'])).toBe('en');
  });

  it('ignores values that are not a supported language', () => {
    expect(detectLang('?lang=fr', 'de', ['en-GB'])).toBe('en');
  });
});

describe('the text the logic writes, in Spanish', () => {
  const base = recommendedAnswers('INTERMEDIATE');

  it('uses the Spanish words in the plan summaries', () => {
    setLang('es', false);
    expect(prescription(answersPlan(base, 120))).toBe('1 x 6-8 y 1 x 8-10');
    expect(planDetail(answersPlan(withStructure(base, 'STRAIGHT'), 120))).toBe('Series iguales, RIR 1, 2:00');
    expect(summaryText(base)).toBe('1 x 6-8 y 1 x 8-10, RIR 1-2, descanso automático');
  });

  it('writes numbers of steps with a dot and the validation messages in Spanish', () => {
    setLang('es', false);
    expect(formatSteps(10000)).toBe('10.000');
    expect(nameError('a')).toBe('El nombre debe tener al menos 2 caracteres.');
    expect(finalWeekHint({ mode: 'DELOAD', fewerSets: true, higherRir: true })).toBe('La última semana lleva la mitad de las series y RIR +2.');
  });

  it('uses the Spanish exercise name when there is one and the English one otherwise', () => {
    const library = buildLibrary([{ slug: 'leg-press', name: 'Leg Press', nameEs: 'Prensa de Piernas', equipment: null, bodyPart: 'upper_legs', mechanic: 'compound', difficulty: 'beginner', primaryMuscles: [] }]);
    setLang('es', false);
    expect(nameOf(library, 'leg-press')).toBe('Prensa de Piernas');
    expect(nameOf(library, 'cable-crunch')).toBe('Cable crunch');
  });

  it('names the sessions in Spanish only where the app does', () => {
    setLang('es', false);
    expect(sessionName(SESSIONS['BRO_CHEST'])).toBe('Pecho');
    expect(sessionName(SESSIONS['PUSH'])).toBe('Push');
  });
});
