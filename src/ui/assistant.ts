import { gsap } from 'gsap';
import {
  EXPERIENCE_OPTIONS,
  buildWeek,
  dayOptions,
  exerciseLabel,
  recommendedDays,
  repsLabel,
  sessionSets,
  weekSets,
  type Experience,
} from '../lib/routine-assistant';
import { TEMPLATES } from '../lib/routine-templates';

// The routine assistant of the hero: experience and days per week build the week; a day opens its exercises.
// Everything rendered here comes from the constants in lib/, never from user text.
export function wireAssistant(root: HTMLElement, animate: boolean): void {
  const options = dayOptions(TEMPLATES);
  const state = { experience: 'INTERMEDIATE' as Experience, days: 4, variant: 0, day: 1 };
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const experienceBox = $('[data-experience]');
  const daysBox = $('[data-days]');
  const variantsBox = $('[data-variants]');
  const variantsFieldset = $('[data-variants-box]');
  const weekBox = $('[data-week]');
  const detailBox = $('[data-detail]');

  const radio = (name: string, value: string, label: string, checked: boolean, extra = '', cls = ''): string =>
    `<input type="radio" id="${name}-${value}" name="${name}" value="${value}"${checked ? ' checked' : ''} /><label for="${name}-${value}" class="${cls}">${label}${extra}</label>`;

  const currentTemplate = () => {
    const option = options.find((o) => o.daysPerWeek === state.days)!;
    return option.templates[Math.min(state.variant, option.templates.length - 1)];
  };

  const renderChoices = () => {
    const rec = recommendedDays(options, state.experience);
    experienceBox.innerHTML = EXPERIENCE_OPTIONS.map((o) => radio('exp', o.value, o.label, o.value === state.experience, `<small>${o.hint}</small>`)).join('');
    $('[data-rec]').textContent = rec ? `(recommended: ${rec})` : '';
    daysBox.innerHTML = options.map((o) => radio('days', String(o.daysPerWeek), String(o.daysPerWeek), o.daysPerWeek === state.days, '', o.daysPerWeek === rec ? 'is-rec' : '')).join('');
    const five = options.find((o) => o.daysPerWeek === state.days)!;
    variantsFieldset.hidden = five.templates.length < 2;
    variantsBox.innerHTML = five.templates.map((t, i) => radio('variant', String(i), t.name, i === state.variant)).join('');
  };

  const renderDetail = (week: ReturnType<typeof buildWeek>) => {
    const day = week.find((d) => d.day === state.day && d.session) ?? week.find((d) => d.session)!;
    state.day = day.day;
    const session = day.session!;
    detailBox.innerHTML = `<h3>Day ${day.day}, ${session.name}<span>${sessionSets(session)} sets</span></h3><ul>${session.exercises
      .map((e) => `<li>${exerciseLabel(e.exercise)}<span>${e.sets} x ${repsLabel(e)}</span></li>`)
      .join('')}</ul>`;
  };

  const renderWeek = (motion: boolean) => {
    const template = currentTemplate();
    const week = buildWeek(template);
    weekBox.setAttribute('aria-label', `Your week, ${template.name}, ${weekSets(week)} sets`);
    weekBox.innerHTML = week
      .map((d) =>
        d.session
          ? `<button type="button" class="cell" data-day="${d.day}" aria-pressed="${d.day === state.day}"><small>Day ${d.day}</small><b>${d.session.name}</b></button>`
          : `<div class="cell cell--rest"><small>Day ${d.day}</small><b>Rest</b></div>`,
      )
      .join('');
    renderDetail(week);
    weekBox.querySelectorAll<HTMLButtonElement>('button[data-day]').forEach((b) => {
      b.addEventListener('click', () => {
        state.day = Number(b.dataset.day);
        renderWeek(false);
        if (animate) gsap.fromTo(detailBox.querySelectorAll('li'), { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', stagger: 0.035 });
      });
    });
    if (motion && animate) {
      gsap.fromTo(weekBox.children, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.045 });
      gsap.fromTo(detailBox.querySelectorAll('li'), { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', stagger: 0.04, delay: 0.15 });
    }
  };

  root.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'exp') {
      state.experience = input.value as Experience;
      const rec = recommendedDays(options, state.experience);
      if (rec) { state.days = rec; state.variant = 0; }
    } else if (input.name === 'days') {
      state.days = Number(input.value);
      state.variant = 0;
    } else if (input.name === 'variant') {
      state.variant = Number(input.value);
    }
    state.day = 1;
    renderChoices();
    renderWeek(true);
    root.querySelector<HTMLInputElement>(`input[name="${input.name}"]:checked`)?.focus();
  });

  renderChoices();
  renderWeek(false);
}
